# Guía para un agente: Next.js + Spring Boot Kotlin + Neon en Vercel

Entrega este archivo completo al agente que implementará el stack en otro repositorio.

## Objetivo

Implementar y desplegar en un único proyecto de Vercel:

- Un frontend Next.js servido desde `/`.
- Un backend Spring Boot con Kotlin y Gradle Kotlin DSL, empaquetado con `Dockerfile.vercel`.
- Neon Postgres conectado al backend.
- El backend expuesto bajo `/api/*` mediante Vercel Services.

La solución debe ser mínima. No agregues ORM, autenticación, Docker Compose, monorepo tooling ni infraestructura adicional salvo que el repositorio ya lo requiera.

## Instrucciones de trabajo

1. Inspecciona primero la estructura, versiones, scripts y cambios sin commit del repositorio. Conserva código existente y adapta las rutas de esta guía.
2. Si el repositorio no tiene esta separación, usa:

   ```text
   /
   ├── frontend/
   ├── backend/
   └── vercel.json
   ```

3. Usa Java 21, Kotlin, Spring Boot y `build.gradle.kts` en el backend.
4. Usa el Next.js existente. Si no existe, crea una aplicación mínima con App Router.
5. No escribas secretos en el repositorio, logs o respuestas. Agrega `.env*` y `.vercel/` al `.gitignore` cuando corresponda.
6. Antes de crear proyectos o integraciones remotas, confirma que el usuario autorizó esas mutaciones.

## Backend

El `backend/build.gradle.kts` debe incluir, como mínimo, equivalentes compatibles de estas dependencias:

```kotlin
plugins {
    kotlin("jvm") version "2.3.21"
    kotlin("plugin.spring") version "2.3.21"
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("tools.jackson.module:jackson-module-kotlin")
    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-jdbc-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

Si el proyecto ya usa versiones compatibles, no las actualices sin necesidad.

Configura `backend/src/main/resources/application.properties` así:

```properties
spring.application.name=app
spring.main.lazy-initialization=true
spring.datasource.url=jdbc:postgresql://${PGHOST}/${PGDATABASE}?sslmode=require
spring.datasource.username=${PGUSER}
spring.datasource.password=${PGPASSWORD}
spring.datasource.hikari.maximum-pool-size=2
spring.datasource.hikari.minimum-idle=0
spring.sql.init.mode=always
server.port=${PORT:8080}
```

No uses esto:

```properties
spring.datasource.url=jdbc:${DATABASE_URL}
```

La URL de Neon tiene formato URI con credenciales en `userinfo`; anteponer `jdbc:` produce una URL que el driver PostgreSQL no acepta. Usa las variables `PGHOST`, `PGDATABASE`, `PGUSER` y `PGPASSWORD` generadas por la integración.

Para una demo mínima, crea `backend/src/main/resources/schema.sql` con una tabla idempotente:

```sql
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    text VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Expón un `GET /api/messages` y un `POST /api/messages`. El POST debe validar que `text`, después de `trim`, tenga entre 1 y 200 caracteres. Si el repositorio ya tiene una API equivalente, úsala para la prueba en lugar de duplicarla.

Para una aplicación real con migraciones versionadas, reemplaza `schema.sql` por Flyway o la herramienta existente y ejecuta migraciones con `DATABASE_URL_UNPOOLED`. El tráfico normal debe usar la conexión pooled de Neon.

## Dockerfile de Vercel

Crea `backend/Dockerfile.vercel`:

```dockerfile
FROM gradle:9.7.1-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle --no-daemon bootJar

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV PORT=80
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 80
CMD ["/opt/java/openjdk/bin/java", "-XX:TieredStopAtLevel=1", "-jar", "app.jar"]
```

Estas decisiones son necesarias para el arranque frío de Vercel:

- Usa Temurin Debian, no la variante Alpine.
- Usa la ruta absoluta `/opt/java/openjdk/bin/java`.
- Conserva `spring.main.lazy-initialization=true`.
- Conserva `-XX:TieredStopAtLevel=1` para priorizar el tiempo de arranque.

Vercel corta la inicialización del contenedor aproximadamente a los 10 segundos. La combinación anterior fue verificada en producción; Spring abrió el servidor dentro del límite.

## Vercel Services

Crea o adapta el `vercel.json` de la raíz:

```json
{
  "services": {
    "frontend": {
      "root": "frontend/",
      "framework": "nextjs"
    },
    "backend": {
      "root": "backend/",
      "runtime": "container",
      "entrypoint": "Dockerfile.vercel"
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

El frontend debe llamar rutas relativas, por ejemplo `fetch("/api/messages")`. No agregues CORS ni una URL pública del backend: ambos servicios comparten dominio y Vercel realiza el rewrite.

En Vercel, el Framework Preset del proyecto debe ser **Services**.

## Neon

Conecta Neon desde Vercel Marketplace al mismo proyecto y a los entornos necesarios: Production, Preview y Development. La integración debe proporcionar, al menos:

- `PGHOST`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`

Usa el host pooled para el runtime. Usa la URL unpooled solamente para migraciones, dumps y tareas administrativas.

Flujo CLI sugerido, adaptándolo a la versión instalada:

```sh
vercel link
vercel integration add neon
vercel env pull .env.local --yes
```

Si la integración requiere interacción o no está disponible por CLI, complétala desde Vercel Marketplace. Nunca imprimas los valores descargados.

## Validación antes del deploy

Ejecuta y corrige cualquier fallo:

```sh
./backend/gradlew -p backend test
npm --prefix frontend run build
docker build -f backend/Dockerfile.vercel backend
```

Si necesitas probar la conexión local, carga las variables con un parser dotenv o mediante el shell. No pases `.env.local` directamente a `docker --env-file` si sus valores están entre comillas: Docker puede conservarlas y romper la URL.

## Deploy y verificación

Despliega producción:

```sh
vercel deploy --prod --yes
```

No consideres terminado el trabajo solo porque el deployment diga `READY`. Verifica toda la ruta:

```sh
vercel curl /
vercel curl /api/messages
vercel curl /api/messages -- \
  --request POST \
  --header "Content-Type: application/json" \
  --data '{"text":"Deployment verified"}'
vercel curl /api/messages
vercel logs --level error --since 10m
```

La aceptación requiere:

- El frontend responde correctamente.
- El GET del backend responde JSON.
- El POST devuelve el registro creado.
- Un GET posterior contiene ese registro, demostrando persistencia en Neon.
- No hay errores nuevos en los runtime logs.

## Diagnóstico rápido

### `FUNCTION_INVOCATION_FAILED` sin logs de Spring

El proceso Java no comenzó. Confirma que el `CMD` use `/opt/java/openjdk/bin/java` y que la imagen runtime sea `eclipse-temurin:21-jre`.

### `Application initialization timed out`

Confirma `spring.main.lazy-initialization=true`, Temurin Debian y `-XX:TieredStopAtLevel=1`. No conectes la base ni ejecutes trabajo adicional antes de abrir el servidor.

### `Driver org.postgresql.Driver claims to not accept jdbcUrl`

No uses `jdbc:${DATABASE_URL}`. Construye la URL JDBC con `PGHOST` y `PGDATABASE`, y configura usuario y contraseña por separado.

### Frontend funciona pero `/api/*` falla o devuelve 404

Confirma que el preset del proyecto sea **Services**, que `backend/Dockerfile.vercel` exista y que el rewrite de `/api/(.*)` apunte al servicio `backend`.

## Entrega esperada

Al finalizar, informa solamente:

- Archivos creados o modificados.
- URL de producción y deployment ID.
- Resultado de tests, build y Docker build.
- Resultado de frontend, GET, POST, persistencia y error logs.
- Cualquier paso manual pendiente, sin incluir secretos.
