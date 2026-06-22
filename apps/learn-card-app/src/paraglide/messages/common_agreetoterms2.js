/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Agreetoterms2Inputs */

const en_common_agreetoterms2 = /** @type {((inputs: Common_Agreetoterms2Inputs) => LocalizedString) & { parts: (inputs: Common_Agreetoterms2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Agreetoterms2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Agree to Terms`)
		}),
		{
			parts: /** @type {(inputs: Common_Agreetoterms2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Agree to " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Terms" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_common_agreetoterms2 = /** @type {((inputs: Common_Agreetoterms2Inputs) => LocalizedString) & { parts: (inputs: Common_Agreetoterms2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Agreetoterms2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Acepto los Términos`)
		}),
		{
			parts: /** @type {(inputs: Common_Agreetoterms2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Acepto los " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Términos" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_common_agreetoterms2 = /** @type {((inputs: Common_Agreetoterms2Inputs) => LocalizedString) & { parts: (inputs: Common_Agreetoterms2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Agreetoterms2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`J'accepte les Conditions`)
		}),
		{
			parts: /** @type {(inputs: Common_Agreetoterms2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "J'accepte les " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Conditions" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_common_agreetoterms2 = /** @type {((inputs: Common_Agreetoterms2Inputs) => LocalizedString) & { parts: (inputs: Common_Agreetoterms2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Agreetoterms2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`أوافق على الشروط`)
		}),
		{
			parts: /** @type {(inputs: Common_Agreetoterms2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أوافق على " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "الشروط" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Agree to Terms" |
*
* @param {Common_Agreetoterms2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_agreetoterms2 = /** @type {((inputs?: Common_Agreetoterms2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Common_Agreetoterms2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Common_Agreetoterms2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Common_Agreetoterms2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_common_agreetoterms2(inputs)
			if (locale === "es") return es_common_agreetoterms2(inputs)
			if (locale === "fr") return fr_common_agreetoterms2(inputs)
			return ar_common_agreetoterms2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Common_Agreetoterms2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_common_agreetoterms2.parts === "function" ? en_common_agreetoterms2.parts(inputs) : [{ type: "text", value: en_common_agreetoterms2(inputs) }]
				if (locale === "es") return typeof es_common_agreetoterms2.parts === "function" ? es_common_agreetoterms2.parts(inputs) : [{ type: "text", value: es_common_agreetoterms2(inputs) }]
				if (locale === "fr") return typeof fr_common_agreetoterms2.parts === "function" ? fr_common_agreetoterms2.parts(inputs) : [{ type: "text", value: fr_common_agreetoterms2(inputs) }]
				return typeof ar_common_agreetoterms2.parts === "function" ? ar_common_agreetoterms2.parts(inputs) : [{ type: "text", value: ar_common_agreetoterms2(inputs) }]
			})
		}
	)
);
export { common_agreetoterms2 as "common.agreeToTerms" }