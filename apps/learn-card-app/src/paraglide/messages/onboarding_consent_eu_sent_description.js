/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ email: NonNullable<unknown> }} Onboarding_Consent_Eu_Sent_DescriptionInputs */

const en_onboarding_consent_eu_sent_description = /** @type {((inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`We sent a consent request to ${i?.email}. We'll notify you once it's approved.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "We sent a consent request to " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". We'll notify you once it's approved." }])
			})
		}
	)
);

const es_onboarding_consent_eu_sent_description = /** @type {((inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Enviamos una solicitud de consentimiento a ${i?.email}. Te avisaremos cuando sea aprobada.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Enviamos una solicitud de consentimiento a " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". Te avisaremos cuando sea aprobada." }])
			})
		}
	)
);

const de_onboarding_consent_eu_sent_description = /** @type {((inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Wir haben eine Zustimmungsanfrage an ${i?.email} gesendet. Wir benachrichtigen dich, sobald sie genehmigt wurde.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Wir haben eine Zustimmungsanfrage an " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " gesendet. Wir benachrichtigen dich, sobald sie genehmigt wurde." }])
			})
		}
	)
);

const ar_onboarding_consent_eu_sent_description = /** @type {((inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`أرسلنا طلب موافقة إلى ${i?.email}. سنعلمك بمجرد الموافقة عليه.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أرسلنا طلب موافقة إلى " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". سنعلمك بمجرد الموافقة عليه." }])
			})
		}
	)
);

const fr_onboarding_consent_eu_sent_description = /** @type {((inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Nous avons envoyé une demande de consentement à ${i?.email}. Nous vous informerons dès qu'elle sera approuvée.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Nous avons envoyé une demande de consentement à " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: ". Nous vous informerons dès qu'elle sera approuvée." }])
			})
		}
	)
);

const ko_onboarding_consent_eu_sent_description = /** @type {((inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`${i?.email}님께 동의 요청을 보냈습니다. 승인되면 알려드리겠습니다.`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.email) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "님께 동의 요청을 보냈습니다. 승인되면 알려드리겠습니다." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "We sent a consent request to {email}. We'll notify you once it's approved." |
*
* @param {Onboarding_Consent_Eu_Sent_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_eu_sent_description = /** @type {((inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & { parts: (inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Onboarding_Consent_Eu_Sent_DescriptionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_onboarding_consent_eu_sent_description(inputs)
			if (locale === "es") return es_onboarding_consent_eu_sent_description(inputs)
			if (locale === "de") return de_onboarding_consent_eu_sent_description(inputs)
			if (locale === "ar") return ar_onboarding_consent_eu_sent_description(inputs)
			if (locale === "fr") return fr_onboarding_consent_eu_sent_description(inputs)
			return ko_onboarding_consent_eu_sent_description(inputs)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Consent_Eu_Sent_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_onboarding_consent_eu_sent_description.parts === "function" ? en_onboarding_consent_eu_sent_description.parts(inputs) : [{ type: "text", value: en_onboarding_consent_eu_sent_description(inputs) }]
				if (locale === "es") return typeof es_onboarding_consent_eu_sent_description.parts === "function" ? es_onboarding_consent_eu_sent_description.parts(inputs) : [{ type: "text", value: es_onboarding_consent_eu_sent_description(inputs) }]
				if (locale === "de") return typeof de_onboarding_consent_eu_sent_description.parts === "function" ? de_onboarding_consent_eu_sent_description.parts(inputs) : [{ type: "text", value: de_onboarding_consent_eu_sent_description(inputs) }]
				if (locale === "ar") return typeof ar_onboarding_consent_eu_sent_description.parts === "function" ? ar_onboarding_consent_eu_sent_description.parts(inputs) : [{ type: "text", value: ar_onboarding_consent_eu_sent_description(inputs) }]
				if (locale === "fr") return typeof fr_onboarding_consent_eu_sent_description.parts === "function" ? fr_onboarding_consent_eu_sent_description.parts(inputs) : [{ type: "text", value: fr_onboarding_consent_eu_sent_description(inputs) }]
				return typeof ko_onboarding_consent_eu_sent_description.parts === "function" ? ko_onboarding_consent_eu_sent_description.parts(inputs) : [{ type: "text", value: ko_onboarding_consent_eu_sent_description(inputs) }]
			})
		}
	)
);
export { onboarding_consent_eu_sent_description as "onboarding.consent.eu.sent.description" }