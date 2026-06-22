/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Enterverificationcode2Inputs */

const en_common_enterverificationcode2 = /** @type {((inputs: Common_Enterverificationcode2Inputs) => LocalizedString) & { parts: (inputs: Common_Enterverificationcode2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Enterverificationcode2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Enter verification code or start over`)
		}),
		{
			parts: /** @type {(inputs: Common_Enterverificationcode2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Enter verification code or " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "start over" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_common_enterverificationcode2 = /** @type {((inputs: Common_Enterverificationcode2Inputs) => LocalizedString) & { parts: (inputs: Common_Enterverificationcode2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Enterverificationcode2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Ingresa el código de verificación o comienza de nuevo`)
		}),
		{
			parts: /** @type {(inputs: Common_Enterverificationcode2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Ingresa el código de verificación o " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "comienza de nuevo" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_common_enterverificationcode2 = /** @type {((inputs: Common_Enterverificationcode2Inputs) => LocalizedString) & { parts: (inputs: Common_Enterverificationcode2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Enterverificationcode2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Saisissez le code de vérification ou recommencez`)
		}),
		{
			parts: /** @type {(inputs: Common_Enterverificationcode2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Saisissez le code de vérification ou " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "recommencez" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_common_enterverificationcode2 = /** @type {((inputs: Common_Enterverificationcode2Inputs) => LocalizedString) & { parts: (inputs: Common_Enterverificationcode2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Common_Enterverificationcode2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`أدخل رمز التحقق أو ابدأ من جديد`)
		}),
		{
			parts: /** @type {(inputs: Common_Enterverificationcode2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أدخل رمز التحقق أو " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "ابدأ من جديد" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Enter verification code or start over" |
*
* @param {Common_Enterverificationcode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_enterverificationcode2 = /** @type {((inputs?: Common_Enterverificationcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Common_Enterverificationcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Common_Enterverificationcode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Common_Enterverificationcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_common_enterverificationcode2(inputs)
			if (locale === "es") return es_common_enterverificationcode2(inputs)
			if (locale === "fr") return fr_common_enterverificationcode2(inputs)
			return ar_common_enterverificationcode2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Common_Enterverificationcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_common_enterverificationcode2.parts === "function" ? en_common_enterverificationcode2.parts(inputs) : [{ type: "text", value: en_common_enterverificationcode2(inputs) }]
				if (locale === "es") return typeof es_common_enterverificationcode2.parts === "function" ? es_common_enterverificationcode2.parts(inputs) : [{ type: "text", value: es_common_enterverificationcode2(inputs) }]
				if (locale === "fr") return typeof fr_common_enterverificationcode2.parts === "function" ? fr_common_enterverificationcode2.parts(inputs) : [{ type: "text", value: fr_common_enterverificationcode2(inputs) }]
				return typeof ar_common_enterverificationcode2.parts === "function" ? ar_common_enterverificationcode2.parts(inputs) : [{ type: "text", value: ar_common_enterverificationcode2(inputs) }]
			})
		}
	)
);
export { common_enterverificationcode2 as "common.enterVerificationCode" }