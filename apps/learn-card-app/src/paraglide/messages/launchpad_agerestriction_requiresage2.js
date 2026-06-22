/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ age: NonNullable<unknown> }} Launchpad_Agerestriction_Requiresage2Inputs */

const en_launchpad_agerestriction_requiresage2 = /** @type {((inputs: Launchpad_Agerestriction_Requiresage2Inputs) => LocalizedString) & { parts: (inputs: Launchpad_Agerestriction_Requiresage2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`This app requires users to be ${i?.age}+ years old.`)
		}),
		{
			parts: /** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "This app requires users to be " }, { type: "markup-start", name: "strong", options: {}, attributes: {} }, { type: "text", value: String(i?.age) }, { type: "text", value: "+" }, { type: "markup-end", name: "strong", options: {}, attributes: {} }, { type: "text", value: " years old." }])
			})
		}
	)
);

const es_launchpad_agerestriction_requiresage2 = /** @type {((inputs: Launchpad_Agerestriction_Requiresage2Inputs) => LocalizedString) & { parts: (inputs: Launchpad_Agerestriction_Requiresage2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Esta app requiere que los usuarios tengan ${i?.age}+ años.`)
		}),
		{
			parts: /** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Esta app requiere que los usuarios tengan " }, { type: "markup-start", name: "strong", options: {}, attributes: {} }, { type: "text", value: String(i?.age) }, { type: "text", value: "+" }, { type: "markup-end", name: "strong", options: {}, attributes: {} }, { type: "text", value: " años." }])
			})
		}
	)
);

const fr_launchpad_agerestriction_requiresage2 = /** @type {((inputs: Launchpad_Agerestriction_Requiresage2Inputs) => LocalizedString) & { parts: (inputs: Launchpad_Agerestriction_Requiresage2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Cette application exige que les utilisateurs aient ${i?.age}+ ans.`)
		}),
		{
			parts: /** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Cette application exige que les utilisateurs aient " }, { type: "markup-start", name: "strong", options: {}, attributes: {} }, { type: "text", value: String(i?.age) }, { type: "text", value: "+" }, { type: "markup-end", name: "strong", options: {}, attributes: {} }, { type: "text", value: " ans." }])
			})
		}
	)
);

const ar_launchpad_agerestriction_requiresage2 = /** @type {((inputs: Launchpad_Agerestriction_Requiresage2Inputs) => LocalizedString) & { parts: (inputs: Launchpad_Agerestriction_Requiresage2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`يتطلب هذا التطبيق أن يكون المستخدمون ${i?.age}+ سنوات.`)
		}),
		{
			parts: /** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "يتطلب هذا التطبيق أن يكون المستخدمون " }, { type: "markup-start", name: "strong", options: {}, attributes: {} }, { type: "text", value: String(i?.age) }, { type: "text", value: "+" }, { type: "markup-end", name: "strong", options: {}, attributes: {} }, { type: "text", value: " سنوات." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "This app requires users to be {age}+ years old." |
*
* @param {Launchpad_Agerestriction_Requiresage2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_agerestriction_requiresage2 = /** @type {((inputs: Launchpad_Agerestriction_Requiresage2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Launchpad_Agerestriction_Requiresage2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Launchpad_Agerestriction_Requiresage2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { strong: { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_launchpad_agerestriction_requiresage2(inputs)
			if (locale === "es") return es_launchpad_agerestriction_requiresage2(inputs)
			if (locale === "fr") return fr_launchpad_agerestriction_requiresage2(inputs)
			return ar_launchpad_agerestriction_requiresage2(inputs)
		}),
		{
			parts: /** @type {(inputs: Launchpad_Agerestriction_Requiresage2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_launchpad_agerestriction_requiresage2.parts === "function" ? en_launchpad_agerestriction_requiresage2.parts(inputs) : [{ type: "text", value: en_launchpad_agerestriction_requiresage2(inputs) }]
				if (locale === "es") return typeof es_launchpad_agerestriction_requiresage2.parts === "function" ? es_launchpad_agerestriction_requiresage2.parts(inputs) : [{ type: "text", value: es_launchpad_agerestriction_requiresage2(inputs) }]
				if (locale === "fr") return typeof fr_launchpad_agerestriction_requiresage2.parts === "function" ? fr_launchpad_agerestriction_requiresage2.parts(inputs) : [{ type: "text", value: fr_launchpad_agerestriction_requiresage2(inputs) }]
				return typeof ar_launchpad_agerestriction_requiresage2.parts === "function" ? ar_launchpad_agerestriction_requiresage2.parts(inputs) : [{ type: "text", value: ar_launchpad_agerestriction_requiresage2(inputs) }]
			})
		}
	)
);
export { launchpad_agerestriction_requiresage2 as "launchpad.ageRestriction.requiresAge" }