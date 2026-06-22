/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Q1_Title1Inputs */

const en_aipersonalization_q1_title1 = /** @type {((inputs: Aipersonalization_Q1_Title1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Q1_Title1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Q1_Title1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`I learn best when I`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Q1_Title1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "I " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "learn best" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " when I" }])
			})
		}
	)
);

const es_aipersonalization_q1_title1 = /** @type {((inputs: Aipersonalization_Q1_Title1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Q1_Title1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Q1_Title1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Aprendo mejor cuando`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Q1_Title1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Aprendo mejor" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " cuando" }])
			})
		}
	)
);

const fr_aipersonalization_q1_title1 = /** @type {((inputs: Aipersonalization_Q1_Title1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Q1_Title1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Q1_Title1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`J'apprends le mieux quand je`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Q1_Title1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "J'apprends le mieux" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " quand je" }])
			})
		}
	)
);

const ar_aipersonalization_q1_title1 = /** @type {((inputs: Aipersonalization_Q1_Title1Inputs) => LocalizedString) & { parts: (inputs: Aipersonalization_Q1_Title1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aipersonalization_Q1_Title1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`أتعلّم بشكل أفضل عندما`)
		}),
		{
			parts: /** @type {(inputs: Aipersonalization_Q1_Title1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "أتعلّم بشكل أفضل" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " عندما" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "I learn best when I" |
*
* @param {Aipersonalization_Q1_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_q1_title1 = /** @type {((inputs?: Aipersonalization_Q1_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Aipersonalization_Q1_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aipersonalization_Q1_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Aipersonalization_Q1_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aipersonalization_q1_title1(inputs)
			if (locale === "es") return es_aipersonalization_q1_title1(inputs)
			if (locale === "fr") return fr_aipersonalization_q1_title1(inputs)
			return ar_aipersonalization_q1_title1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Aipersonalization_Q1_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aipersonalization_q1_title1.parts === "function" ? en_aipersonalization_q1_title1.parts(inputs) : [{ type: "text", value: en_aipersonalization_q1_title1(inputs) }]
				if (locale === "es") return typeof es_aipersonalization_q1_title1.parts === "function" ? es_aipersonalization_q1_title1.parts(inputs) : [{ type: "text", value: es_aipersonalization_q1_title1(inputs) }]
				if (locale === "fr") return typeof fr_aipersonalization_q1_title1.parts === "function" ? fr_aipersonalization_q1_title1.parts(inputs) : [{ type: "text", value: fr_aipersonalization_q1_title1(inputs) }]
				return typeof ar_aipersonalization_q1_title1.parts === "function" ? ar_aipersonalization_q1_title1.parts(inputs) : [{ type: "text", value: ar_aipersonalization_q1_title1(inputs) }]
			})
		}
	)
);
export { aipersonalization_q1_title1 as "aiPersonalization.q1.title" }