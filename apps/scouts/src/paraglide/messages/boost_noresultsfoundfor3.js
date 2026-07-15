/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown>, search: NonNullable<unknown> }} Boost_Noresultsfoundfor3Inputs */

const en_boost_noresultsfoundfor3 = /** @type {((inputs: Boost_Noresultsfoundfor3Inputs) => LocalizedString) & { parts: (inputs: Boost_Noresultsfoundfor3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noresultsfoundfor3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`0 ${i?.title}s found for ${i?.search}`)
		}),
		{
			parts: /** @type {(inputs: Boost_Noresultsfoundfor3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "0 " }, { type: "text", value: String(i?.title) }, { type: "text", value: "s found for " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.search) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_boost_noresultsfoundfor3 = /** @type {((inputs: Boost_Noresultsfoundfor3Inputs) => LocalizedString) & { parts: (inputs: Boost_Noresultsfoundfor3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noresultsfoundfor3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`0 ${i?.title}s encontrados para ${i?.search}`)
		}),
		{
			parts: /** @type {(inputs: Boost_Noresultsfoundfor3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "0 " }, { type: "text", value: String(i?.title) }, { type: "text", value: "s encontrados para " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.search) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_boost_noresultsfoundfor3 = /** @type {((inputs: Boost_Noresultsfoundfor3Inputs) => LocalizedString) & { parts: (inputs: Boost_Noresultsfoundfor3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noresultsfoundfor3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`0 ${i?.title} trouvé pour ${i?.search}`)
		}),
		{
			parts: /** @type {(inputs: Boost_Noresultsfoundfor3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "0 " }, { type: "text", value: String(i?.title) }, { type: "text", value: " trouvé pour " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.search) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_boost_noresultsfoundfor3 = /** @type {((inputs: Boost_Noresultsfoundfor3Inputs) => LocalizedString) & { parts: (inputs: Boost_Noresultsfoundfor3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noresultsfoundfor3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`لم يتم العثور على 0 ${i?.title} لـ ${i?.search}`)
		}),
		{
			parts: /** @type {(inputs: Boost_Noresultsfoundfor3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "لم يتم العثور على 0 " }, { type: "text", value: String(i?.title) }, { type: "text", value: " لـ " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.search) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "0 {title}s found for {search}" |
*
* @param {Boost_Noresultsfoundfor3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_noresultsfoundfor3 = /** @type {((inputs: Boost_Noresultsfoundfor3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Boost_Noresultsfoundfor3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Boost_Noresultsfoundfor3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noresultsfoundfor3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_boost_noresultsfoundfor3(inputs)
			if (locale === "es") return es_boost_noresultsfoundfor3(inputs)
			if (locale === "fr") return fr_boost_noresultsfoundfor3(inputs)
			return ar_boost_noresultsfoundfor3(inputs)
		}),
		{
			parts: /** @type {(inputs: Boost_Noresultsfoundfor3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_boost_noresultsfoundfor3.parts === "function" ? en_boost_noresultsfoundfor3.parts(inputs) : [{ type: "text", value: en_boost_noresultsfoundfor3(inputs) }]
				if (locale === "es") return typeof es_boost_noresultsfoundfor3.parts === "function" ? es_boost_noresultsfoundfor3.parts(inputs) : [{ type: "text", value: es_boost_noresultsfoundfor3(inputs) }]
				if (locale === "fr") return typeof fr_boost_noresultsfoundfor3.parts === "function" ? fr_boost_noresultsfoundfor3.parts(inputs) : [{ type: "text", value: fr_boost_noresultsfoundfor3(inputs) }]
				return typeof ar_boost_noresultsfoundfor3.parts === "function" ? ar_boost_noresultsfoundfor3.parts(inputs) : [{ type: "text", value: ar_boost_noresultsfoundfor3(inputs) }]
			})
		}
	)
);
export { boost_noresultsfoundfor3 as "boost.noResultsFoundFor" }