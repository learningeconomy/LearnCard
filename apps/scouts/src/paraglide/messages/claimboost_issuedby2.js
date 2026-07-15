/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claimboost_Issuedby2Inputs */

const en_claimboost_issuedby2 = /** @type {((inputs: Claimboost_Issuedby2Inputs) => LocalizedString) & { parts: (inputs: Claimboost_Issuedby2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Claimboost_Issuedby2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`by {name}`)
		}),
		{
			parts: /** @type {(inputs: Claimboost_Issuedby2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "by " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "{name}" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_claimboost_issuedby2 = /** @type {((inputs: Claimboost_Issuedby2Inputs) => LocalizedString) & { parts: (inputs: Claimboost_Issuedby2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Claimboost_Issuedby2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`por {name}`)
		}),
		{
			parts: /** @type {(inputs: Claimboost_Issuedby2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "por " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "{name}" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_claimboost_issuedby2 = /** @type {((inputs: Claimboost_Issuedby2Inputs) => LocalizedString) & { parts: (inputs: Claimboost_Issuedby2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Claimboost_Issuedby2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`par {name}`)
		}),
		{
			parts: /** @type {(inputs: Claimboost_Issuedby2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "par " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "{name}" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_claimboost_issuedby2 = /** @type {((inputs: Claimboost_Issuedby2Inputs) => LocalizedString) & { parts: (inputs: Claimboost_Issuedby2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Claimboost_Issuedby2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`بواسطة {name}`)
		}),
		{
			parts: /** @type {(inputs: Claimboost_Issuedby2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "بواسطة " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "{name}" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "by {name}" |
*
* @param {Claimboost_Issuedby2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claimboost_issuedby2 = /** @type {((inputs?: Claimboost_Issuedby2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Claimboost_Issuedby2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Claimboost_Issuedby2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Claimboost_Issuedby2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_claimboost_issuedby2(inputs)
			if (locale === "es") return es_claimboost_issuedby2(inputs)
			if (locale === "fr") return fr_claimboost_issuedby2(inputs)
			return ar_claimboost_issuedby2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Claimboost_Issuedby2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_claimboost_issuedby2.parts === "function" ? en_claimboost_issuedby2.parts(inputs) : [{ type: "text", value: en_claimboost_issuedby2(inputs) }]
				if (locale === "es") return typeof es_claimboost_issuedby2.parts === "function" ? es_claimboost_issuedby2.parts(inputs) : [{ type: "text", value: es_claimboost_issuedby2(inputs) }]
				if (locale === "fr") return typeof fr_claimboost_issuedby2.parts === "function" ? fr_claimboost_issuedby2.parts(inputs) : [{ type: "text", value: fr_claimboost_issuedby2(inputs) }]
				return typeof ar_claimboost_issuedby2.parts === "function" ? ar_claimboost_issuedby2.parts(inputs) : [{ type: "text", value: ar_claimboost_issuedby2(inputs) }]
			})
		}
	)
);
export { claimboost_issuedby2 as "claimBoost.issuedBy" }