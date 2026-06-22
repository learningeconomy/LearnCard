/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Jobstability_Ready2Inputs */

const en_aiinsights_jobstability_ready2 = /** @type {((inputs: Aiinsights_Jobstability_Ready2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Jobstability_Ready2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Jobstability_Ready2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Others felt their jobs are ready to compare once you finish your profile.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Jobstability_Ready2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Others felt their jobs are " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "ready to compare" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " once you finish your profile." }])
			})
		}
	)
);

const es_aiinsights_jobstability_ready2 = /** @type {((inputs: Aiinsights_Jobstability_Ready2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Jobstability_Ready2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Jobstability_Ready2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Otros sintieron que sus trabajos están listos para comparar una vez que completes tu perfil.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Jobstability_Ready2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Otros sintieron que sus trabajos están " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "listos para comparar" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " una vez que completes tu perfil." }])
			})
		}
	)
);

const fr_aiinsights_jobstability_ready2 = /** @type {((inputs: Aiinsights_Jobstability_Ready2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Jobstability_Ready2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Jobstability_Ready2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`D'autres ont estimé que leur emploi est prêt à comparer une fois votre profil complété.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Jobstability_Ready2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "D'autres ont estimé que leur emploi est " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "prêt à comparer" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " une fois votre profil complété." }])
			})
		}
	)
);

const ar_aiinsights_jobstability_ready2 = /** @type {((inputs: Aiinsights_Jobstability_Ready2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Jobstability_Ready2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Jobstability_Ready2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`شعر آخرون أن وظائفهم جاهزة للمقارنة بمجرد إكمال ملفك الشخصي.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Jobstability_Ready2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "شعر آخرون أن وظائفهم " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "جاهزة للمقارنة" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " بمجرد إكمال ملفك الشخصي." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Others felt their jobs are ready to compare once you finish your profile." |
*
* @param {Aiinsights_Jobstability_Ready2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_jobstability_ready2 = /** @type {((inputs?: Aiinsights_Jobstability_Ready2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Aiinsights_Jobstability_Ready2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Jobstability_Ready2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Aiinsights_Jobstability_Ready2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_jobstability_ready2(inputs)
			if (locale === "es") return es_aiinsights_jobstability_ready2(inputs)
			if (locale === "fr") return fr_aiinsights_jobstability_ready2(inputs)
			return ar_aiinsights_jobstability_ready2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Aiinsights_Jobstability_Ready2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_jobstability_ready2.parts === "function" ? en_aiinsights_jobstability_ready2.parts(inputs) : [{ type: "text", value: en_aiinsights_jobstability_ready2(inputs) }]
				if (locale === "es") return typeof es_aiinsights_jobstability_ready2.parts === "function" ? es_aiinsights_jobstability_ready2.parts(inputs) : [{ type: "text", value: es_aiinsights_jobstability_ready2(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_jobstability_ready2.parts === "function" ? fr_aiinsights_jobstability_ready2.parts(inputs) : [{ type: "text", value: fr_aiinsights_jobstability_ready2(inputs) }]
				return typeof ar_aiinsights_jobstability_ready2.parts === "function" ? ar_aiinsights_jobstability_ready2.parts(inputs) : [{ type: "text", value: ar_aiinsights_jobstability_ready2(inputs) }]
			})
		}
	)
);
export { aiinsights_jobstability_ready2 as "aiInsights.jobStability.ready" }