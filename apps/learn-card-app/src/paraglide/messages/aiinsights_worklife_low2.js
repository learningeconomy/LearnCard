/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Worklife_Low2Inputs */

const en_aiinsights_worklife_low2 = /** @type {((inputs: Aiinsights_Worklife_Low2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Low2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Low2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Your current work life balance is low compared to others.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Low2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Your current work life balance " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "is low" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " compared to others." }])
			})
		}
	)
);

const es_aiinsights_worklife_low2 = /** @type {((inputs: Aiinsights_Worklife_Low2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Low2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Low2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Tu equilibrio trabajo-vida actual es bajo comparado con otros.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Low2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Tu equilibrio trabajo-vida actual " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "es bajo" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " comparado con otros." }])
			})
		}
	)
);

const fr_aiinsights_worklife_low2 = /** @type {((inputs: Aiinsights_Worklife_Low2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Low2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Low2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Votre équilibre vie pro-vie perso actuel est faible par rapport aux autres.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Low2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Votre équilibre vie pro-vie perso actuel est " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "faible" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " par rapport aux autres." }])
			})
		}
	)
);

const ar_aiinsights_worklife_low2 = /** @type {((inputs: Aiinsights_Worklife_Low2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Low2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Low2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`توازن عملك وحياتك الحالي منخفض مقارنة بالآخرين.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Low2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "توازن عملك وحياتك الحالي " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "منخفض" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " مقارنة بالآخرين." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Your current work life balance is low compared to others." |
*
* @param {Aiinsights_Worklife_Low2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_worklife_low2 = /** @type {((inputs?: Aiinsights_Worklife_Low2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Aiinsights_Worklife_Low2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Worklife_Low2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Aiinsights_Worklife_Low2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_worklife_low2(inputs)
			if (locale === "es") return es_aiinsights_worklife_low2(inputs)
			if (locale === "fr") return fr_aiinsights_worklife_low2(inputs)
			return ar_aiinsights_worklife_low2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Aiinsights_Worklife_Low2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_worklife_low2.parts === "function" ? en_aiinsights_worklife_low2.parts(inputs) : [{ type: "text", value: en_aiinsights_worklife_low2(inputs) }]
				if (locale === "es") return typeof es_aiinsights_worklife_low2.parts === "function" ? es_aiinsights_worklife_low2.parts(inputs) : [{ type: "text", value: es_aiinsights_worklife_low2(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_worklife_low2.parts === "function" ? fr_aiinsights_worklife_low2.parts(inputs) : [{ type: "text", value: fr_aiinsights_worklife_low2(inputs) }]
				return typeof ar_aiinsights_worklife_low2.parts === "function" ? ar_aiinsights_worklife_low2.parts(inputs) : [{ type: "text", value: ar_aiinsights_worklife_low2(inputs) }]
			})
		}
	)
);
export { aiinsights_worklife_low2 as "aiInsights.workLife.low" }