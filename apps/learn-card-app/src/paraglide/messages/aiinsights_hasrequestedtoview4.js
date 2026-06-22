/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ ownerName: NonNullable<unknown>, userName: NonNullable<unknown> }} Aiinsights_Hasrequestedtoview4Inputs */

const en_aiinsights_hasrequestedtoview4 = /** @type {((inputs: Aiinsights_Hasrequestedtoview4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Hasrequestedtoview4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.ownerName} has requested to view ${i?.userName}'s insights.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.ownerName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " has requested to view " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.userName) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "'s insights." }])
			})
		}
	)
);

const es_aiinsights_hasrequestedtoview4 = /** @type {((inputs: Aiinsights_Hasrequestedtoview4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Hasrequestedtoview4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.ownerName} ha solicitado ver los insights de ${i?.userName}.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.ownerName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " ha solicitado ver los insights de " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.userName) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const fr_aiinsights_hasrequestedtoview4 = /** @type {((inputs: Aiinsights_Hasrequestedtoview4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Hasrequestedtoview4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.ownerName} a demandé à voir les insights de ${i?.userName}.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.ownerName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " a demandé à voir les insights de " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.userName) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const ar_aiinsights_hasrequestedtoview4 = /** @type {((inputs: Aiinsights_Hasrequestedtoview4Inputs) => LocalizedString) & { parts: (inputs: Aiinsights_Hasrequestedtoview4Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.ownerName} طلب عرض رؤى ${i?.userName}.`)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.ownerName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " طلب عرض رؤى " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: String(i?.userName) }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "{ownerName} has requested to view {userName}'s insights." |
*
* @param {Aiinsights_Hasrequestedtoview4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_hasrequestedtoview4 = /** @type {((inputs: Aiinsights_Hasrequestedtoview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Aiinsights_Hasrequestedtoview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Aiinsights_Hasrequestedtoview4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_aiinsights_hasrequestedtoview4(inputs)
			if (locale === "es") return es_aiinsights_hasrequestedtoview4(inputs)
			if (locale === "fr") return fr_aiinsights_hasrequestedtoview4(inputs)
			return ar_aiinsights_hasrequestedtoview4(inputs)
		}),
		{
			parts: /** @type {(inputs: Aiinsights_Hasrequestedtoview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_aiinsights_hasrequestedtoview4.parts === "function" ? en_aiinsights_hasrequestedtoview4.parts(inputs) : [{ type: "text", value: en_aiinsights_hasrequestedtoview4(inputs) }]
				if (locale === "es") return typeof es_aiinsights_hasrequestedtoview4.parts === "function" ? es_aiinsights_hasrequestedtoview4.parts(inputs) : [{ type: "text", value: es_aiinsights_hasrequestedtoview4(inputs) }]
				if (locale === "fr") return typeof fr_aiinsights_hasrequestedtoview4.parts === "function" ? fr_aiinsights_hasrequestedtoview4.parts(inputs) : [{ type: "text", value: fr_aiinsights_hasrequestedtoview4(inputs) }]
				return typeof ar_aiinsights_hasrequestedtoview4.parts === "function" ? ar_aiinsights_hasrequestedtoview4.parts(inputs) : [{ type: "text", value: ar_aiinsights_hasrequestedtoview4(inputs) }]
			})
		}
	)
);
export { aiinsights_hasrequestedtoview4 as "aiInsights.hasRequestedToView" }