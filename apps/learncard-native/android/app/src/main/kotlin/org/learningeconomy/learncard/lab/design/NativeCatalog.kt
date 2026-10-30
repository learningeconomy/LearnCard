package org.learningeconomy.learncard.lab.design

import org.json.JSONObject

/** Reads the shared String Catalog (`localization/Localizable.xcstrings`). */
class NativeCatalog private constructor(
    private val strings: Map<String, Map<String, String>>,
    private val plurals: Map<String, Map<String, Map<String, String>>>,
) {
    private val english = strings["en"].orEmpty() + plurals["en"].orEmpty().mapValues { it.value["other"] ?: "" }
    private val literalKeys: Map<String, String> = buildMap {
        for (key in english.keys.sorted()) {
            if (key.endsWith(".short")) continue
            val source = english[key] ?: continue
            if (source !in this) put(source, key)
        }
    }

    fun text(key: String, language: String): String {
        strings[language]?.get(key)?.let { return it }
        plurals[language]?.get(key)?.get("other")?.let { return it }
        return english[key] ?: key
    }

    fun literal(source: String, language: String): String {
        val key = literalKeys[source] ?: return source
        return text(key, language)
    }

    fun format(key: String, language: String, vararg values: String): String {
        var template = text(key, language)
        for (value in values) {
            val index = template.indexOf("%@")
            if (index < 0) break
            template = template.replaceRange(index, index + 2, value)
        }
        return template
    }

    fun count(key: String, count: Int, language: String): String {
        val forms = plurals[language]?.get(key) ?: plurals["en"]?.get(key) ?: return text(key, language)
        val variant = when (language) {
            "ar" -> when {
                count == 0 && "zero" in forms -> "zero"
                count == 1 && "one" in forms -> "one"
                count == 2 && "two" in forms -> "two"
                count in 3..10 && "few" in forms -> "few"
                count in 11..99 && "many" in forms -> "many"
                else -> "other"
            }
            else -> when {
                count == 0 && "zero" in forms -> "zero"
                count == 1 && "one" in forms -> "one"
                else -> "other"
            }
        }
        return (forms[variant] ?: forms["other"] ?: key).replace("%lld", count.toString())
    }

    companion object {
        fun parse(json: String): NativeCatalog {
            val catalog = JSONObject(json).getJSONObject("strings")
            val strings = mutableMapOf<String, MutableMap<String, String>>()
            val plurals = mutableMapOf<String, MutableMap<String, MutableMap<String, String>>>()
            val keys = catalog.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val localizations = catalog.getJSONObject(key).optJSONObject("localizations") ?: continue
                val languages = localizations.keys()
                while (languages.hasNext()) {
                    val language = languages.next()
                    val entry = localizations.getJSONObject(language)
                    val unit = entry.optJSONObject("stringUnit")
                    if (unit != null) {
                        strings.getOrPut(language) { mutableMapOf() }[key] = unit.getString("value")
                    } else {
                        val plural = entry.optJSONObject("variations")?.optJSONObject("plural") ?: continue
                        val forms = mutableMapOf<String, String>()
                        val variants = plural.keys()
                        while (variants.hasNext()) {
                            val variant = variants.next()
                            forms[variant] = plural.getJSONObject(variant).getJSONObject("stringUnit").getString("value")
                        }
                        plurals.getOrPut(language) { mutableMapOf() }[key] = forms
                    }
                }
            }
            return NativeCatalog(strings, plurals)
        }
    }
}
