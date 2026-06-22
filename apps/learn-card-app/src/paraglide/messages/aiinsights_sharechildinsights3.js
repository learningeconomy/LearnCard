/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ child: NonNullable<unknown>, teacher: NonNullable<unknown> }} Aiinsights_Sharechildinsights3Inputs */

const en_aiinsights_sharechildinsights3 = /** @type {((inputs: Aiinsights_Sharechildinsights3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Sharechildinsights3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Sharechildinsights3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Share ${i?.child}'s insights with ${i?.teacher}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Sharechildinsights3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Share " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.child) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "'s insights with " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.teacher) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const es_aiinsights_sharechildinsights3 = /** @type {((inputs: Aiinsights_Sharechildinsights3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Sharechildinsights3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Sharechildinsights3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Comparte los Insights de ${i?.child} con ${i?.teacher}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Sharechildinsights3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Comparte los Insights de " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.child) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " con " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.teacher) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_aiinsights_sharechildinsights3 = /** @type {((inputs: Aiinsights_Sharechildinsights3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Sharechildinsights3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Sharechildinsights3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Partagez les Insights de ${i?.child} avec ${i?.teacher}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Sharechildinsights3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Partagez les Insights de " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.child) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " avec " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.teacher) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_aiinsights_sharechildinsights3 = /** @type {((inputs: Aiinsights_Sharechildinsights3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Sharechildinsights3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Sharechildinsights3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`شارك رؤى ${i?.child} مع ${i?.teacher}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Sharechildinsights3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "شارك رؤى " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.child) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " مع " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.teacher) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Share {child}'s insights with {teacher}" |
*
* @param {Aiinsights_Sharechildinsights3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_sharechildinsights3 = /** @type {((inputs: Aiinsights_Sharechildinsights3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Aiinsights_Sharechildinsights3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Sharechildinsights3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Sharechildinsights3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_sharechildinsights3(inputs)
			if (locale === "es") return es_aiinsights_sharechildinsights3(inputs)
			if (locale === "fr") return fr_aiinsights_sharechildinsights3(inputs)
			return ar_aiinsights_sharechildinsights3(inputs)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Sharechildinsights3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_sharechildinsights3.parts === "function" ? en_aiinsights_sharechildinsights3.parts(inputs) : [{ type: "text", value: en_aiinsights_sharechildinsights3(inputs) }]
				if (locale === "es") return typeof es_aiinsights_sharechildinsights3.parts === "function" ? es_aiinsights_sharechildinsights3.parts(inputs) : [{ type: "text", value: es_aiinsights_sharechildinsights3(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_sharechildinsights3.parts === "function" ? fr_aiinsights_sharechildinsights3.parts(inputs) : [{ type: "text", value: fr_aiinsights_sharechildinsights3(inputs) }]
				return typeof ar_aiinsights_sharechildinsights3.parts === "function" ? ar_aiinsights_sharechildinsights3.parts(inputs) : [{ type: "text", value: ar_aiinsights_sharechildinsights3(inputs) }]
			})
		}
	)
);
export { aiinsights_sharechildinsights3 as "aiInsights.shareChildInsights" }