/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ query: NonNullable<unknown> }} Common_Searchresults_Noresultsfor3Inputs */

const en_common_searchresults_noresultsfor3 = /** @type {((inputs: Common_Searchresults_Noresultsfor3Inputs) => LocalizedString) & { parts: (inputs: Common_Searchresults_Noresultsfor3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`No results found for ${i?.query}`)
		}),
		{
			parts: /** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "No results found for " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.query) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_common_searchresults_noresultsfor3 = /** @type {((inputs: Common_Searchresults_Noresultsfor3Inputs) => LocalizedString) & { parts: (inputs: Common_Searchresults_Noresultsfor3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`No se encontraron resultados para ${i?.query}`)
		}),
		{
			parts: /** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "No se encontraron resultados para " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.query) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_common_searchresults_noresultsfor3 = /** @type {((inputs: Common_Searchresults_Noresultsfor3Inputs) => LocalizedString) & { parts: (inputs: Common_Searchresults_Noresultsfor3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Aucun résultat trouvé pour ${i?.query}`)
		}),
		{
			parts: /** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Aucun résultat trouvé pour " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.query) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_common_searchresults_noresultsfor3 = /** @type {((inputs: Common_Searchresults_Noresultsfor3Inputs) => LocalizedString) & { parts: (inputs: Common_Searchresults_Noresultsfor3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`لم يتم العثور على نتائج لـ ${i?.query}`)
		}),
		{
			parts: /** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "لم يتم العثور على نتائج لـ " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.query) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "No results found for {query}" |
*
* @param {Common_Searchresults_Noresultsfor3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_searchresults_noresultsfor3 = /** @type {((inputs: Common_Searchresults_Noresultsfor3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Common_Searchresults_Noresultsfor3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Common_Searchresults_Noresultsfor3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_common_searchresults_noresultsfor3(inputs)
			if (locale === "es") return es_common_searchresults_noresultsfor3(inputs)
			if (locale === "fr") return fr_common_searchresults_noresultsfor3(inputs)
			return ar_common_searchresults_noresultsfor3(inputs)
		}),
		{
			parts: /** @type {(inputs: Common_Searchresults_Noresultsfor3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_common_searchresults_noresultsfor3.parts === "function" ? en_common_searchresults_noresultsfor3.parts(inputs) : [{ type: "text", value: en_common_searchresults_noresultsfor3(inputs) }]
				if (locale === "es") return typeof es_common_searchresults_noresultsfor3.parts === "function" ? es_common_searchresults_noresultsfor3.parts(inputs) : [{ type: "text", value: es_common_searchresults_noresultsfor3(inputs) }]
				if (locale === "fr") return typeof fr_common_searchresults_noresultsfor3.parts === "function" ? fr_common_searchresults_noresultsfor3.parts(inputs) : [{ type: "text", value: fr_common_searchresults_noresultsfor3(inputs) }]
				return typeof ar_common_searchresults_noresultsfor3.parts === "function" ? ar_common_searchresults_noresultsfor3.parts(inputs) : [{ type: "text", value: ar_common_searchresults_noresultsfor3(inputs) }]
			})
		}
	)
);
export { common_searchresults_noresultsfor3 as "common.searchResults.noResultsFor" }