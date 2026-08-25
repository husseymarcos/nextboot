package com.example.nextboot

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

@SpringBootApplication
class NextbootApplication

fun main(args: Array<String>) {
    runApplication<NextbootApplication>(*args)
}

@RestController
@RequestMapping("/api/messages")
class MessageController(private val jdbc: JdbcTemplate) {
    private val messageMapper = RowMapper<Message> { result, _ ->
        Message(
            result.getLong("id"),
            result.getString("text"),
            result.getTimestamp("created_at").toInstant(),
        )
    }

    @GetMapping
    fun list(): List<Message> =
        jdbc.query("select id, text, created_at from messages order by id desc limit 50", messageMapper)

    @GetMapping("/health")
    fun health(): Map<String, String> =
        mapOf("status" to "ok", "service" to "nextboot-backend", "version" to "backend-v2")

    @PostMapping
    fun create(@RequestBody request: MessageRequest): Message {
        val text = request.text?.trim().orEmpty()
        if (text.isEmpty() || text.length > 200) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Message must be 1–200 characters")
        }

        return checkNotNull(
            jdbc.queryForObject(
                "insert into messages (text) values (?) returning id, text, created_at",
                messageMapper,
                text,
            ),
        )
    }
}

data class Message(val id: Long, val text: String, val createdAt: Instant)

data class MessageRequest(val text: String?)
