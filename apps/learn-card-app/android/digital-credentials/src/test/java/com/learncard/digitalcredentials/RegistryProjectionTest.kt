package com.learncard.digitalcredentials

import org.json.JSONObject
import org.junit.Assert.assertThrows
import org.junit.Test

class RegistryProjectionTest {
    private fun entry() = JSONObject("""{"id":"1c79a688-44ed-492d-98ec-bc65f6d60443","vct":"https://example.com/course","title":"Sample","claims":[{"path":["course_name"],"displayName":"Course"}]}""")

    @Test fun acceptsMetadataOnly() { RegistryProjection.validate(entry()) }

    @Test fun rejectsCredentialBodyAndStorageReferences() {
        for (key in listOf("compact", "privateKey", "uri", "credential")) {
            assertThrows(IllegalArgumentException::class.java) { RegistryProjection.validate(entry().put(key, "forbidden")) }
        }
    }

    @Test fun rejectsClaimValues() {
        val input = entry()
        input.getJSONArray("claims").getJSONObject(0).put("value", "private claim")
        assertThrows(IllegalArgumentException::class.java) { RegistryProjection.validate(input) }
    }

    @Test fun rejectsIdentifyingEntryIdsAndEmptyClaimPaths() {
        assertThrows(IllegalArgumentException::class.java) { RegistryProjection.validate(entry().put("id", "https://cloud.example/credential")) }
        val input = entry()
        input.getJSONArray("claims").getJSONObject(0).getJSONArray("path").remove(0)
        assertThrows(IllegalArgumentException::class.java) { RegistryProjection.validate(input) }
    }
}
