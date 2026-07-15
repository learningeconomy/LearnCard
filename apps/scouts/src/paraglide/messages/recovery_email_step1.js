/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Email_Step1Inputs */

const en_recovery_email_step1 = /** @type {((inputs: Recovery_Email_Step1Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Step1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Step1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Search your inbox for an email with the subject "Your ScoutPass Recovery Key"`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Step1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Search your inbox for an email with the subject " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "\"Your ScoutPass Recovery Key\"" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_recovery_email_step1 = /** @type {((inputs: Recovery_Email_Step1Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Step1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Step1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Busca en tu bandeja de entrada un correo con el asunto "Your ScoutPass Recovery Key"`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Step1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Busca en tu bandeja de entrada un correo con el asunto " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "\"Your ScoutPass Recovery Key\"" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_recovery_email_step1 = /** @type {((inputs: Recovery_Email_Step1Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Step1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Step1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Cherchez dans votre boîte de réception un e-mail avec l'objet « Votre clé de récupération ScoutPass »`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Step1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Cherchez dans votre boîte de réception un e-mail avec l'objet " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "« Votre clé de récupération ScoutPass »" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_recovery_email_step1 = /** @type {((inputs: Recovery_Email_Step1Inputs) => LocalizedString) & { parts: (inputs: Recovery_Email_Step1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Email_Step1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`ابحث في صندوق الوارد الخاص بك عن بريد إلكتروني بموضوع "مفتاح استرداد ScoutPass الخاص بك"`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Email_Step1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "ابحث في صندوق الوارد الخاص بك عن بريد إلكتروني بموضوع " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "\"مفتاح استرداد ScoutPass الخاص بك\"" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Search your inbox for an email with the subject \"Your ScoutPass Recovery Key\"" |
*
* @param {Recovery_Email_Step1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_email_step1 = /** @type {((inputs?: Recovery_Email_Step1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Recovery_Email_Step1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Recovery_Email_Step1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Recovery_Email_Step1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_recovery_email_step1(inputs)
			if (locale === "es") return es_recovery_email_step1(inputs)
			if (locale === "fr") return fr_recovery_email_step1(inputs)
			return ar_recovery_email_step1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Recovery_Email_Step1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_recovery_email_step1.parts === "function" ? en_recovery_email_step1.parts(inputs) : [{ type: "text", value: en_recovery_email_step1(inputs) }]
				if (locale === "es") return typeof es_recovery_email_step1.parts === "function" ? es_recovery_email_step1.parts(inputs) : [{ type: "text", value: es_recovery_email_step1(inputs) }]
				if (locale === "fr") return typeof fr_recovery_email_step1.parts === "function" ? fr_recovery_email_step1.parts(inputs) : [{ type: "text", value: fr_recovery_email_step1(inputs) }]
				return typeof ar_recovery_email_step1.parts === "function" ? ar_recovery_email_step1.parts(inputs) : [{ type: "text", value: ar_recovery_email_step1(inputs) }]
			})
		}
	)
);
export { recovery_email_step1 as "recovery.email.step1" }