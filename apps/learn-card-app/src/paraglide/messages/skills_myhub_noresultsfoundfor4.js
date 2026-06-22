/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ query: NonNullable<unknown> }} Skills_Myhub_Noresultsfoundfor4Inputs */

const en_skills_myhub_noresultsfoundfor4 = /** @type {((inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => LocalizedString) & { parts: (inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`No results found for ${i?.query}`)
		}),
		{
			parts: /** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "No results found for " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.query) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_skills_myhub_noresultsfoundfor4 = /** @type {((inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => LocalizedString) & { parts: (inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`No se encontraron resultados para ${i?.query}`)
		}),
		{
			parts: /** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "No se encontraron resultados para " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.query) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_skills_myhub_noresultsfoundfor4 = /** @type {((inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => LocalizedString) & { parts: (inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Aucun résultat trouvé pour ${i?.query}`)
		}),
		{
			parts: /** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Aucun résultat trouvé pour " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.query) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_skills_myhub_noresultsfoundfor4 = /** @type {((inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => LocalizedString) & { parts: (inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`لا توجد نتائج لـ ${i?.query}`)
		}),
		{
			parts: /** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "لا توجد نتائج لـ " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.query) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "No results found for {query}" |
*
* @param {Skills_Myhub_Noresultsfoundfor4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_myhub_noresultsfoundfor4 = /** @type {((inputs: Skills_Myhub_Noresultsfoundfor4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Skills_Myhub_Noresultsfoundfor4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Skills_Myhub_Noresultsfoundfor4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_skills_myhub_noresultsfoundfor4(inputs)
			if (locale === "es") return es_skills_myhub_noresultsfoundfor4(inputs)
			if (locale === "fr") return fr_skills_myhub_noresultsfoundfor4(inputs)
			return ar_skills_myhub_noresultsfoundfor4(inputs)
		}),
		{
			parts: /** @type {(inputs: Skills_Myhub_Noresultsfoundfor4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_skills_myhub_noresultsfoundfor4.parts === "function" ? en_skills_myhub_noresultsfoundfor4.parts(inputs) : [{ type: "text", value: en_skills_myhub_noresultsfoundfor4(inputs) }]
				if (locale === "es") return typeof es_skills_myhub_noresultsfoundfor4.parts === "function" ? es_skills_myhub_noresultsfoundfor4.parts(inputs) : [{ type: "text", value: es_skills_myhub_noresultsfoundfor4(inputs) }]
				if (locale === "fr") return typeof fr_skills_myhub_noresultsfoundfor4.parts === "function" ? fr_skills_myhub_noresultsfoundfor4.parts(inputs) : [{ type: "text", value: fr_skills_myhub_noresultsfoundfor4(inputs) }]
				return typeof ar_skills_myhub_noresultsfoundfor4.parts === "function" ? ar_skills_myhub_noresultsfoundfor4.parts(inputs) : [{ type: "text", value: ar_skills_myhub_noresultsfoundfor4(inputs) }]
			})
		}
	)
);
export { skills_myhub_noresultsfoundfor4 as "skills.myHub.noResultsFoundFor" }