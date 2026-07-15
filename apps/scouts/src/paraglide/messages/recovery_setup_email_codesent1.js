/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ email: NonNullable<unknown> }} Recovery_Setup_Email_Codesent1Inputs */

const en_recovery_setup_email_codesent1 = /** @type {((inputs: Recovery_Setup_Email_Codesent1Inputs) => LocalizedString) & { parts: (inputs: Recovery_Setup_Email_Codesent1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`We sent a 6-digit code to ${i?.email}. Check your inbox.`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "We sent a 6-digit code to " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". Check your inbox." }])
			})
		}
	)
);

const es_recovery_setup_email_codesent1 = /** @type {((inputs: Recovery_Setup_Email_Codesent1Inputs) => LocalizedString) & { parts: (inputs: Recovery_Setup_Email_Codesent1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Enviamos un código de 6 dígitos a ${i?.email}. Revisa tu bandeja de entrada.`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Enviamos un código de 6 dígitos a " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". Revisa tu bandeja de entrada." }])
			})
		}
	)
);

const fr_recovery_setup_email_codesent1 = /** @type {((inputs: Recovery_Setup_Email_Codesent1Inputs) => LocalizedString) & { parts: (inputs: Recovery_Setup_Email_Codesent1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Nous avons envoyé un code à 6 chiffres à ${i?.email}. Vérifiez votre boîte de réception.`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Nous avons envoyé un code à 6 chiffres à " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". Vérifiez votre boîte de réception." }])
			})
		}
	)
);

const ar_recovery_setup_email_codesent1 = /** @type {((inputs: Recovery_Setup_Email_Codesent1Inputs) => LocalizedString) & { parts: (inputs: Recovery_Setup_Email_Codesent1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`أرسلنا رمزاً من 6 أرقام إلى ${i?.email}. تحقق من صندوق الوارد الخاص بك.`)
		}),
		{
			parts: /** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أرسلنا رمزاً من 6 أرقام إلى " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". تحقق من صندوق الوارد الخاص بك." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "We sent a 6-digit code to {email}. Check your inbox." |
*
* @param {Recovery_Setup_Email_Codesent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_codesent1 = /** @type {((inputs: Recovery_Setup_Email_Codesent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Recovery_Setup_Email_Codesent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Codesent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_recovery_setup_email_codesent1(inputs)
			if (locale === "es") return es_recovery_setup_email_codesent1(inputs)
			if (locale === "fr") return fr_recovery_setup_email_codesent1(inputs)
			return ar_recovery_setup_email_codesent1(inputs)
		}),
		{
			parts: /** @type {(inputs: Recovery_Setup_Email_Codesent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_recovery_setup_email_codesent1.parts === "function" ? en_recovery_setup_email_codesent1.parts(inputs) : [{ type: "text", value: en_recovery_setup_email_codesent1(inputs) }]
				if (locale === "es") return typeof es_recovery_setup_email_codesent1.parts === "function" ? es_recovery_setup_email_codesent1.parts(inputs) : [{ type: "text", value: es_recovery_setup_email_codesent1(inputs) }]
				if (locale === "fr") return typeof fr_recovery_setup_email_codesent1.parts === "function" ? fr_recovery_setup_email_codesent1.parts(inputs) : [{ type: "text", value: fr_recovery_setup_email_codesent1(inputs) }]
				return typeof ar_recovery_setup_email_codesent1.parts === "function" ? ar_recovery_setup_email_codesent1.parts(inputs) : [{ type: "text", value: ar_recovery_setup_email_codesent1(inputs) }]
			})
		}
	)
);
export { recovery_setup_email_codesent1 as "recovery.setup.email.codeSent" }