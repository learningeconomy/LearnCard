/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ type: NonNullable<unknown>, search: NonNullable<unknown> }} Boost_Noboostpackfound3Inputs */

const en_boost_noboostpackfound3 = /** @type {((inputs: Boost_Noboostpackfound3Inputs) => LocalizedString) & { parts: (inputs: Boost_Noboostpackfound3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noboostpackfound3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`0 ${i?.type} Packs found for ${i?.search}`)
		}),
		{
			parts: /** @type {(inputs: Boost_Noboostpackfound3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "0 " }, { type: "text", value: String(i?.type) }, { type: "text", value: " Packs found for " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.search) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_boost_noboostpackfound3 = /** @type {((inputs: Boost_Noboostpackfound3Inputs) => LocalizedString) & { parts: (inputs: Boost_Noboostpackfound3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noboostpackfound3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`0 Packs de ${i?.type} encontrados para ${i?.search}`)
		}),
		{
			parts: /** @type {(inputs: Boost_Noboostpackfound3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "0 Packs de " }, { type: "text", value: String(i?.type) }, { type: "text", value: " encontrados para " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.search) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_boost_noboostpackfound3 = /** @type {((inputs: Boost_Noboostpackfound3Inputs) => LocalizedString) & { parts: (inputs: Boost_Noboostpackfound3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noboostpackfound3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`0 pack ${i?.type} trouvé pour ${i?.search}`)
		}),
		{
			parts: /** @type {(inputs: Boost_Noboostpackfound3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "0 pack " }, { type: "text", value: String(i?.type) }, { type: "text", value: " trouvé pour " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.search) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_boost_noboostpackfound3 = /** @type {((inputs: Boost_Noboostpackfound3Inputs) => LocalizedString) & { parts: (inputs: Boost_Noboostpackfound3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noboostpackfound3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`لم يتم العثور على 0 حزمة ${i?.type} لـ ${i?.search}`)
		}),
		{
			parts: /** @type {(inputs: Boost_Noboostpackfound3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "لم يتم العثور على 0 حزمة " }, { type: "text", value: String(i?.type) }, { type: "text", value: " لـ " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.search) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "0 {type} Packs found for {search}" |
*
* @param {Boost_Noboostpackfound3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_noboostpackfound3 = /** @type {((inputs: Boost_Noboostpackfound3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Boost_Noboostpackfound3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Boost_Noboostpackfound3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Boost_Noboostpackfound3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_boost_noboostpackfound3(inputs)
			if (locale === "es") return es_boost_noboostpackfound3(inputs)
			if (locale === "fr") return fr_boost_noboostpackfound3(inputs)
			return ar_boost_noboostpackfound3(inputs)
		}),
		{
			parts: /** @type {(inputs: Boost_Noboostpackfound3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_boost_noboostpackfound3.parts === "function" ? en_boost_noboostpackfound3.parts(inputs) : [{ type: "text", value: en_boost_noboostpackfound3(inputs) }]
				if (locale === "es") return typeof es_boost_noboostpackfound3.parts === "function" ? es_boost_noboostpackfound3.parts(inputs) : [{ type: "text", value: es_boost_noboostpackfound3(inputs) }]
				if (locale === "fr") return typeof fr_boost_noboostpackfound3.parts === "function" ? fr_boost_noboostpackfound3.parts(inputs) : [{ type: "text", value: fr_boost_noboostpackfound3(inputs) }]
				return typeof ar_boost_noboostpackfound3.parts === "function" ? ar_boost_noboostpackfound3.parts(inputs) : [{ type: "text", value: ar_boost_noboostpackfound3(inputs) }]
			})
		}
	)
);
export { boost_noboostpackfound3 as "boost.noBoostPackFound" }