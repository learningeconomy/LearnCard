/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Jobstability_Strong2Inputs */

const en_aiinsights_jobstability_strong2 = /** @type {((inputs: Aiinsights_Jobstability_Strong2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Jobstability_Strong2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Jobstability_Strong2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Your current job stability is strong compared to others.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Jobstability_Strong2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Your current job stability " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "is strong" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " compared to others." }])
			})
		}
	)
);

const es_aiinsights_jobstability_strong2 = /** @type {((inputs: Aiinsights_Jobstability_Strong2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Jobstability_Strong2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Jobstability_Strong2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Tu estabilidad laboral actual es fuerte comparada con otros.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Jobstability_Strong2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Tu estabilidad laboral actual " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "es fuerte" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " comparada con otros." }])
			})
		}
	)
);

const fr_aiinsights_jobstability_strong2 = /** @type {((inputs: Aiinsights_Jobstability_Strong2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Jobstability_Strong2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Jobstability_Strong2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Votre stabilité d'emploi actuelle est forte par rapport aux autres.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Jobstability_Strong2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Votre stabilité d'emploi actuelle est " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "forte" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " par rapport aux autres." }])
			})
		}
	)
);

const ar_aiinsights_jobstability_strong2 = /** @type {((inputs: Aiinsights_Jobstability_Strong2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Jobstability_Strong2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Jobstability_Strong2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`استقرار وظيفتك الحالي قوي مقارنة بالآخرين.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Jobstability_Strong2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "استقرار وظيفتك الحالي " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "قوي" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " مقارنة بالآخرين." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Your current job stability is strong compared to others." |
*
* @param {Aiinsights_Jobstability_Strong2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_jobstability_strong2 = /** @type {((inputs?: Aiinsights_Jobstability_Strong2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Aiinsights_Jobstability_Strong2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Jobstability_Strong2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Aiinsights_Jobstability_Strong2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_jobstability_strong2(inputs)
			if (locale === "es") return es_aiinsights_jobstability_strong2(inputs)
			if (locale === "fr") return fr_aiinsights_jobstability_strong2(inputs)
			return ar_aiinsights_jobstability_strong2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Aiinsights_Jobstability_Strong2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_jobstability_strong2.parts === "function" ? en_aiinsights_jobstability_strong2.parts(inputs) : [{ type: "text", value: en_aiinsights_jobstability_strong2(inputs) }]
				if (locale === "es") return typeof es_aiinsights_jobstability_strong2.parts === "function" ? es_aiinsights_jobstability_strong2.parts(inputs) : [{ type: "text", value: es_aiinsights_jobstability_strong2(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_jobstability_strong2.parts === "function" ? fr_aiinsights_jobstability_strong2.parts(inputs) : [{ type: "text", value: fr_aiinsights_jobstability_strong2(inputs) }]
				return typeof ar_aiinsights_jobstability_strong2.parts === "function" ? ar_aiinsights_jobstability_strong2.parts(inputs) : [{ type: "text", value: ar_aiinsights_jobstability_strong2(inputs) }]
			})
		}
	)
);
export { aiinsights_jobstability_strong2 as "aiInsights.jobStability.strong" }