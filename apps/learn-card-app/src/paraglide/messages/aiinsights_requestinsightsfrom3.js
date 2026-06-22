/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Aiinsights_Requestinsightsfrom3Inputs */

const en_aiinsights_requestinsightsfrom3 = /** @type {((inputs: Aiinsights_Requestinsightsfrom3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Requestinsightsfrom3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Request Insights from  ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Request Insights from " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " " }, { type: "text", value: String(i?.name) }])
			})
		}
	)
);

const es_aiinsights_requestinsightsfrom3 = /** @type {((inputs: Aiinsights_Requestinsightsfrom3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Requestinsightsfrom3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Solicitar Insights de  ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Solicitar Insights de " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " " }, { type: "text", value: String(i?.name) }])
			})
		}
	)
);

const fr_aiinsights_requestinsightsfrom3 = /** @type {((inputs: Aiinsights_Requestinsightsfrom3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Requestinsightsfrom3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Demander des Insights à  ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Demander des Insights à " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " " }, { type: "text", value: String(i?.name) }])
			})
		}
	)
);

const ar_aiinsights_requestinsightsfrom3 = /** @type {((inputs: Aiinsights_Requestinsightsfrom3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Requestinsightsfrom3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`طلب رؤى من  ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "طلب رؤى من " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " " }, { type: "text", value: String(i?.name) }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Request Insights from {name}" |
*
* @param {Aiinsights_Requestinsightsfrom3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_requestinsightsfrom3 = /** @type {((inputs: Aiinsights_Requestinsightsfrom3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Aiinsights_Requestinsightsfrom3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Requestinsightsfrom3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { br: { options: {}; attributes: {}; children: false } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_requestinsightsfrom3(inputs)
			if (locale === "es") return es_aiinsights_requestinsightsfrom3(inputs)
			if (locale === "fr") return fr_aiinsights_requestinsightsfrom3(inputs)
			return ar_aiinsights_requestinsightsfrom3(inputs)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Requestinsightsfrom3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_requestinsightsfrom3.parts === "function" ? en_aiinsights_requestinsightsfrom3.parts(inputs) : [{ type: "text", value: en_aiinsights_requestinsightsfrom3(inputs) }]
				if (locale === "es") return typeof es_aiinsights_requestinsightsfrom3.parts === "function" ? es_aiinsights_requestinsightsfrom3.parts(inputs) : [{ type: "text", value: es_aiinsights_requestinsightsfrom3(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_requestinsightsfrom3.parts === "function" ? fr_aiinsights_requestinsightsfrom3.parts(inputs) : [{ type: "text", value: fr_aiinsights_requestinsightsfrom3(inputs) }]
				return typeof ar_aiinsights_requestinsightsfrom3.parts === "function" ? ar_aiinsights_requestinsightsfrom3.parts(inputs) : [{ type: "text", value: ar_aiinsights_requestinsightsfrom3(inputs) }]
			})
		}
	)
);
export { aiinsights_requestinsightsfrom3 as "aiInsights.requestInsightsFrom" }