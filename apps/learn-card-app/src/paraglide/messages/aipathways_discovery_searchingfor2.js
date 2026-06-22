/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ keyword: NonNullable<unknown> }} Aipathways_Discovery_Searchingfor2Inputs */

const en_aipathways_discovery_searchingfor2 = /** @type {((inputs: Aipathways_Discovery_Searchingfor2Inputs) => LocalizedString) & { parts: (inputs: Aipathways_Discovery_Searchingfor2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Searching for: ${i?.keyword}`)
		}),
		{
			parts: /** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Searching for: " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.keyword) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_aipathways_discovery_searchingfor2 = /** @type {((inputs: Aipathways_Discovery_Searchingfor2Inputs) => LocalizedString) & { parts: (inputs: Aipathways_Discovery_Searchingfor2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Buscando: ${i?.keyword}`)
		}),
		{
			parts: /** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Buscando: " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.keyword) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_aipathways_discovery_searchingfor2 = /** @type {((inputs: Aipathways_Discovery_Searchingfor2Inputs) => LocalizedString) & { parts: (inputs: Aipathways_Discovery_Searchingfor2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Recherche : ${i?.keyword}`)
		}),
		{
			parts: /** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Recherche : " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.keyword) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_aipathways_discovery_searchingfor2 = /** @type {((inputs: Aipathways_Discovery_Searchingfor2Inputs) => LocalizedString) & { parts: (inputs: Aipathways_Discovery_Searchingfor2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`البحث عن: ${i?.keyword}`)
		}),
		{
			parts: /** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "البحث عن: " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.keyword) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Searching for: {keyword}" |
*
* @param {Aipathways_Discovery_Searchingfor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_discovery_searchingfor2 = /** @type {((inputs: Aipathways_Discovery_Searchingfor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Aipathways_Discovery_Searchingfor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aipathways_Discovery_Searchingfor2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aipathways_discovery_searchingfor2(inputs)
			if (locale === "es") return es_aipathways_discovery_searchingfor2(inputs)
			if (locale === "fr") return fr_aipathways_discovery_searchingfor2(inputs)
			return ar_aipathways_discovery_searchingfor2(inputs)
		}),
		{
			parts: /** @type {(inputs: Aipathways_Discovery_Searchingfor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aipathways_discovery_searchingfor2.parts === "function" ? en_aipathways_discovery_searchingfor2.parts(inputs) : [{ type: "text", value: en_aipathways_discovery_searchingfor2(inputs) }]
				if (locale === "es") return typeof es_aipathways_discovery_searchingfor2.parts === "function" ? es_aipathways_discovery_searchingfor2.parts(inputs) : [{ type: "text", value: es_aipathways_discovery_searchingfor2(inputs) }]
				if (locale === "fr") return typeof fr_aipathways_discovery_searchingfor2.parts === "function" ? fr_aipathways_discovery_searchingfor2.parts(inputs) : [{ type: "text", value: fr_aipathways_discovery_searchingfor2(inputs) }]
				return typeof ar_aipathways_discovery_searchingfor2.parts === "function" ? ar_aipathways_discovery_searchingfor2.parts(inputs) : [{ type: "text", value: ar_aipathways_discovery_searchingfor2(inputs) }]
			})
		}
	)
);
export { aipathways_discovery_searchingfor2 as "aiPathways.discovery.searchingFor" }