package com.example.nextboot

import org.mockito.Mockito.mock
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.web.server.ResponseStatusException
import kotlin.test.Test
import kotlin.test.assertFailsWith

class NextbootApplicationTest {
    @Test
    fun rejectsInvalidMessages() {
        val controller = MessageController(mock(JdbcTemplate::class.java))

        assertFailsWith<ResponseStatusException> { controller.create(MessageRequest("   ")) }
        assertFailsWith<ResponseStatusException> { controller.create(MessageRequest("x".repeat(201))) }
    }
}
