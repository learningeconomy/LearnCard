/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Worklife_Ready2Inputs */

const en_aiinsights_worklife_ready2 = /** @type {((inputs: Aiinsights_Worklife_Ready2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Ready2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Ready2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Your current work life balance is ready to compare once you finish your profile.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Ready2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Your current work life balance is " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "ready to compare" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " once you finish your profile." }])
			})
		}
	)
);

const es_aiinsights_worklife_ready2 = /** @type {((inputs: Aiinsights_Worklife_Ready2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Ready2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Ready2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Tu equilibrio trabajo-vida actual está listo para comparar una vez que completes tu perfil.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Ready2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Tu equilibrio trabajo-vida actual está " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "listo para comparar" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " una vez que completes tu perfil." }])
			})
		}
	)
);

const fr_aiinsights_worklife_ready2 = /** @type {((inputs: Aiinsights_Worklife_Ready2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Ready2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Ready2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Votre équilibre vie pro-vie perso actuel est prêt à être comparé une fois votre profil complété.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Ready2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Votre équilibre vie pro-vie perso actuel est " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "prêt à être comparé" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " une fois votre profil complété." }])
			})
		}
	)
);

const ar_aiinsights_worklife_ready2 = /** @type {((inputs: Aiinsights_Worklife_Ready2Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Worklife_Ready2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Worklife_Ready2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`توازن عملك وحياتك الحالي جاهز للمقارنة بمجرد إكمال ملفك الشخصي.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Worklife_Ready2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "توازن عملك وحياتك الحالي " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "جاهز للمقارنة" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " بمجرد إكمال ملفك الشخصي." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Your current work life balance is ready to compare once you finish your profile." |
*
* @param {Aiinsights_Worklife_Ready2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_worklife_ready2 = /** @type {((inputs?: Aiinsights_Worklife_Ready2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Aiinsights_Worklife_Ready2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Worklife_Ready2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Aiinsights_Worklife_Ready2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_worklife_ready2(inputs)
			if (locale === "es") return es_aiinsights_worklife_ready2(inputs)
			if (locale === "fr") return fr_aiinsights_worklife_ready2(inputs)
			return ar_aiinsights_worklife_ready2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Aiinsights_Worklife_Ready2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_worklife_ready2.parts === "function" ? en_aiinsights_worklife_ready2.parts(inputs) : [{ type: "text", value: en_aiinsights_worklife_ready2(inputs) }]
				if (locale === "es") return typeof es_aiinsights_worklife_ready2.parts === "function" ? es_aiinsights_worklife_ready2.parts(inputs) : [{ type: "text", value: es_aiinsights_worklife_ready2(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_worklife_ready2.parts === "function" ? fr_aiinsights_worklife_ready2.parts(inputs) : [{ type: "text", value: fr_aiinsights_worklife_ready2(inputs) }]
				return typeof ar_aiinsights_worklife_ready2.parts === "function" ? ar_aiinsights_worklife_ready2.parts(inputs) : [{ type: "text", value: ar_aiinsights_worklife_ready2(inputs) }]
			})
		}
	)
);
export { aiinsights_worklife_ready2 as "aiInsights.workLife.ready" }