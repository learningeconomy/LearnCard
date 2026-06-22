/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ childName: NonNullable<unknown>, targetName: NonNullable<unknown> }} Aiinsights_Wantstoshare3Inputs */

const en_aiinsights_wantstoshare3 = /** @type {((inputs: Aiinsights_Wantstoshare3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Wantstoshare3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Wantstoshare3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.childName} wants to share their insights with ${i?.targetName}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Wantstoshare3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.childName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " wants to share their insights with " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.targetName) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const es_aiinsights_wantstoshare3 = /** @type {((inputs: Aiinsights_Wantstoshare3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Wantstoshare3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Wantstoshare3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.childName} quiere compartir sus insights con ${i?.targetName}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Wantstoshare3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.childName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " quiere compartir sus insights con " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.targetName) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_aiinsights_wantstoshare3 = /** @type {((inputs: Aiinsights_Wantstoshare3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Wantstoshare3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Wantstoshare3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.childName} souhaite partager ses insights avec ${i?.targetName}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Wantstoshare3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.childName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " souhaite partager ses insights avec " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.targetName) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_aiinsights_wantstoshare3 = /** @type {((inputs: Aiinsights_Wantstoshare3Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Wantstoshare3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Wantstoshare3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.childName} يريد مشاركة رؤاه مع ${i?.targetName}`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Wantstoshare3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.childName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " يريد مشاركة رؤاه مع " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.targetName) }, { type: "markup-end", name: "1", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "{childName} wants to share their insights with {targetName}" |
*
* @param {Aiinsights_Wantstoshare3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_wantstoshare3 = /** @type {((inputs: Aiinsights_Wantstoshare3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Aiinsights_Wantstoshare3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Wantstoshare3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Wantstoshare3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_wantstoshare3(inputs)
			if (locale === "es") return es_aiinsights_wantstoshare3(inputs)
			if (locale === "fr") return fr_aiinsights_wantstoshare3(inputs)
			return ar_aiinsights_wantstoshare3(inputs)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Wantstoshare3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_wantstoshare3.parts === "function" ? en_aiinsights_wantstoshare3.parts(inputs) : [{ type: "text", value: en_aiinsights_wantstoshare3(inputs) }]
				if (locale === "es") return typeof es_aiinsights_wantstoshare3.parts === "function" ? es_aiinsights_wantstoshare3.parts(inputs) : [{ type: "text", value: es_aiinsights_wantstoshare3(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_wantstoshare3.parts === "function" ? fr_aiinsights_wantstoshare3.parts(inputs) : [{ type: "text", value: fr_aiinsights_wantstoshare3(inputs) }]
				return typeof ar_aiinsights_wantstoshare3.parts === "function" ? ar_aiinsights_wantstoshare3.parts(inputs) : [{ type: "text", value: ar_aiinsights_wantstoshare3(inputs) }]
			})
		}
	)
);
export { aiinsights_wantstoshare3 as "aiInsights.wantsToShare" }