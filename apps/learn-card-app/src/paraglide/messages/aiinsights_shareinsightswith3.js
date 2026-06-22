/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Aiinsights_Shareinsightswith3Inputs */

const en_aiinsights_shareinsightswith3 = /** @type {((inputs: Aiinsights_Shareinsightswith3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Shareinsightswith3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Shareinsightswith3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Share Insights with  ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Shareinsightswith3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Share Insights with " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " " }, { type: "text", value: String(i?.name) }])
			})
		}
	)
);

const es_aiinsights_shareinsightswith3 = /** @type {((inputs: Aiinsights_Shareinsightswith3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Shareinsightswith3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Shareinsightswith3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Compartir Insights con  ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Shareinsightswith3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Compartir Insights con " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " " }, { type: "text", value: String(i?.name) }])
			})
		}
	)
);

const fr_aiinsights_shareinsightswith3 = /** @type {((inputs: Aiinsights_Shareinsightswith3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Shareinsightswith3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Shareinsightswith3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Partager les Insights avec  ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Shareinsightswith3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Partager les Insights avec " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " " }, { type: "text", value: String(i?.name) }])
			})
		}
	)
);

const ar_aiinsights_shareinsightswith3 = /** @type {((inputs: Aiinsights_Shareinsightswith3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Shareinsightswith3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Shareinsightswith3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`مشاركة الرؤى مع  ${i?.name}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Shareinsightswith3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "مشاركة الرؤى مع " }, { type: "markup-standalone", name: "br", options: {}, attributes: {} }, { type: "text", value: " " }, { type: "text", value: String(i?.name) }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Share Insights with {name}" |
*
* @param {Aiinsights_Shareinsightswith3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_shareinsightswith3 = /** @type {((inputs: Aiinsights_Shareinsightswith3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Aiinsights_Shareinsightswith3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Shareinsightswith3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { br: { options: {}; attributes: {}; children: false } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Shareinsightswith3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_shareinsightswith3(inputs)
			if (locale === "es") return es_aiinsights_shareinsightswith3(inputs)
			if (locale === "fr") return fr_aiinsights_shareinsightswith3(inputs)
			return ar_aiinsights_shareinsightswith3(inputs)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Shareinsightswith3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_shareinsightswith3.parts === "function" ? en_aiinsights_shareinsightswith3.parts(inputs) : [{ type: "text", value: en_aiinsights_shareinsightswith3(inputs) }]
				if (locale === "es") return typeof es_aiinsights_shareinsightswith3.parts === "function" ? es_aiinsights_shareinsightswith3.parts(inputs) : [{ type: "text", value: es_aiinsights_shareinsightswith3(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_shareinsightswith3.parts === "function" ? fr_aiinsights_shareinsightswith3.parts(inputs) : [{ type: "text", value: fr_aiinsights_shareinsightswith3(inputs) }]
				return typeof ar_aiinsights_shareinsightswith3.parts === "function" ? ar_aiinsights_shareinsightswith3.parts(inputs) : [{ type: "text", value: ar_aiinsights_shareinsightswith3(inputs) }]
			})
		}
	)
);
export { aiinsights_shareinsightswith3 as "aiInsights.shareInsightsWith" }