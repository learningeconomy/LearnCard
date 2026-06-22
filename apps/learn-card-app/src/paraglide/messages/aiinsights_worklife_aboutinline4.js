/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Worklife_Aboutinline4Inputs */

const en_aiinsights_worklife_aboutinline4 = /** @type {((inputs: Aiinsights_Worklife_Aboutinline4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Aboutinline4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Aboutinline4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Your current work life balance is about in line with others.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Aboutinline4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Your current work life balance is " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "about in line with others" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const es_aiinsights_worklife_aboutinline4 = /** @type {((inputs: Aiinsights_Worklife_Aboutinline4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Aboutinline4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Aboutinline4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Tu equilibrio trabajo-vida actual está más o menos en línea con otros.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Aboutinline4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Tu equilibrio trabajo-vida actual está " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "más o menos en línea con otros" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const fr_aiinsights_worklife_aboutinline4 = /** @type {((inputs: Aiinsights_Worklife_Aboutinline4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Aboutinline4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Aboutinline4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Votre équilibre vie pro-vie perso actuel est dans la moyenne.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Aboutinline4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Votre équilibre vie pro-vie perso actuel est " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "dans la moyenne" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const ar_aiinsights_worklife_aboutinline4 = /** @type {((inputs: Aiinsights_Worklife_Aboutinline4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Aboutinline4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Aboutinline4Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`توازن عملك وحياتك الحالي في حدود المتوسط.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Aboutinline4Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "توازن عملك وحياتك الحالي " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "في حدود المتوسط" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Your current work life balance is about in line with others." |
*
* @param {Aiinsights_Worklife_Aboutinline4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_worklife_aboutinline4 = /** @type {((inputs?: Aiinsights_Worklife_Aboutinline4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Aiinsights_Worklife_Aboutinline4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Worklife_Aboutinline4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Aiinsights_Worklife_Aboutinline4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_worklife_aboutinline4(inputs)
			if (locale === "es") return es_aiinsights_worklife_aboutinline4(inputs)
			if (locale === "fr") return fr_aiinsights_worklife_aboutinline4(inputs)
			return ar_aiinsights_worklife_aboutinline4(inputs)
		}),
		{
			parts: /** @type {(inputs?: Aiinsights_Worklife_Aboutinline4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_worklife_aboutinline4.parts === "function" ? en_aiinsights_worklife_aboutinline4.parts(inputs) : [{ type: "text", value: en_aiinsights_worklife_aboutinline4(inputs) }]
				if (locale === "es") return typeof es_aiinsights_worklife_aboutinline4.parts === "function" ? es_aiinsights_worklife_aboutinline4.parts(inputs) : [{ type: "text", value: es_aiinsights_worklife_aboutinline4(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_worklife_aboutinline4.parts === "function" ? fr_aiinsights_worklife_aboutinline4.parts(inputs) : [{ type: "text", value: fr_aiinsights_worklife_aboutinline4(inputs) }]
				return typeof ar_aiinsights_worklife_aboutinline4.parts === "function" ? ar_aiinsights_worklife_aboutinline4.parts(inputs) : [{ type: "text", value: ar_aiinsights_worklife_aboutinline4(inputs) }]
			})
		}
	)
);
export { aiinsights_worklife_aboutinline4 as "aiInsights.workLife.aboutInLine" }