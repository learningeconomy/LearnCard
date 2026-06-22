/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Parentinvite_Description1Inputs */

const en_onboarding_consent_parentinvite_description1 = /** @type {((inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Click the Share Invite button or type in their email and click the Send Invite button.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Click the " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Share Invite" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " button or type in their email and click the " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "Send Invite" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: " button." }])
			})
		}
	)
);

const es_onboarding_consent_parentinvite_description1 = /** @type {((inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Haz clic en Compartir invitación o escribe su correo y haz clic en Enviar invitación.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Haz clic en " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Compartir invitación" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " o escribe su correo y haz clic en " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "Enviar invitación" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const fr_onboarding_consent_parentinvite_description1 = /** @type {((inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Cliquez sur Partager l'invitation ou saisissez son e-mail et cliquez sur Envoyer l'invitation.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Cliquez sur " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Partager l'invitation" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " ou saisissez son e-mail et cliquez sur " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "Envoyer l'invitation" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const ar_onboarding_consent_parentinvite_description1 = /** @type {((inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`انقر على مشاركة الدعوة أو اكتب بريدهم الإلكتروني وانقر على إرسال الدعوة.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Parentinvite_Description1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "انقر على " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "مشاركة الدعوة" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " أو اكتب بريدهم الإلكتروني وانقر على " }, { type: "markup-start", name: "1", options: {}, attributes: {} }, { type: "text", value: "إرسال الدعوة" }, { type: "markup-end", name: "1", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Click the Share Invite button or type in their email and click the Send Invite button." |
*
* @param {Onboarding_Consent_Parentinvite_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_parentinvite_description1 = /** @type {((inputs?: Onboarding_Consent_Parentinvite_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Onboarding_Consent_Parentinvite_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Onboarding_Consent_Parentinvite_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true }; "1": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Onboarding_Consent_Parentinvite_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_onboarding_consent_parentinvite_description1(inputs)
			if (locale === "es") return es_onboarding_consent_parentinvite_description1(inputs)
			if (locale === "fr") return fr_onboarding_consent_parentinvite_description1(inputs)
			return ar_onboarding_consent_parentinvite_description1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Onboarding_Consent_Parentinvite_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_onboarding_consent_parentinvite_description1.parts === "function" ? en_onboarding_consent_parentinvite_description1.parts(inputs) : [{ type: "text", value: en_onboarding_consent_parentinvite_description1(inputs) }]
				if (locale === "es") return typeof es_onboarding_consent_parentinvite_description1.parts === "function" ? es_onboarding_consent_parentinvite_description1.parts(inputs) : [{ type: "text", value: es_onboarding_consent_parentinvite_description1(inputs) }]
				if (locale === "fr") return typeof fr_onboarding_consent_parentinvite_description1.parts === "function" ? fr_onboarding_consent_parentinvite_description1.parts(inputs) : [{ type: "text", value: fr_onboarding_consent_parentinvite_description1(inputs) }]
				return typeof ar_onboarding_consent_parentinvite_description1.parts === "function" ? ar_onboarding_consent_parentinvite_description1.parts(inputs) : [{ type: "text", value: ar_onboarding_consent_parentinvite_description1(inputs) }]
			})
		}
	)
);
export { onboarding_consent_parentinvite_description1 as "onboarding.consent.parentInvite.description" }