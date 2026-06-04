/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Email_Verification_TitleInputs */

const en_login_email_verification_title = /** @type {((inputs: Login_Email_Verification_TitleInputs) => LocalizedString) & { parts: (inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Email_Verification_TitleInputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Enter verification code or start over`)
		}),
		{
			parts: /** @type {(inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Enter verification code or " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "start over" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_login_email_verification_title = /** @type {((inputs: Login_Email_Verification_TitleInputs) => LocalizedString) & { parts: (inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Email_Verification_TitleInputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Ingresa el código de verificación o comienza de nuevo`)
		}),
		{
			parts: /** @type {(inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Ingresa el código de verificación o " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "comienza de nuevo" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const de_login_email_verification_title = /** @type {((inputs: Login_Email_Verification_TitleInputs) => LocalizedString) & { parts: (inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Email_Verification_TitleInputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Gib den Bestätigungscode ein oder beginne von vorn`)
		}),
		{
			parts: /** @type {(inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Gib den Bestätigungscode ein oder " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "beginne von vorn" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_login_email_verification_title = /** @type {((inputs: Login_Email_Verification_TitleInputs) => LocalizedString) & { parts: (inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Email_Verification_TitleInputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`أدخل رمز التحقق أو ابدأ من جديد`)
		}),
		{
			parts: /** @type {(inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "أدخل رمز التحقق أو " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "ابدأ من جديد" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_login_email_verification_title = /** @type {((inputs: Login_Email_Verification_TitleInputs) => LocalizedString) & { parts: (inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Email_Verification_TitleInputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Saisissez le code de vérification ou recommencez`)
		}),
		{
			parts: /** @type {(inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Saisissez le code de vérification ou " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "recommencez" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ko_login_email_verification_title = /** @type {((inputs: Login_Email_Verification_TitleInputs) => LocalizedString) & { parts: (inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Email_Verification_TitleInputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`인증 코드를 입력하거나 다시 시작하세요`)
		}),
		{
			parts: /** @type {(inputs: Login_Email_Verification_TitleInputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "인증 코드를 입력하거나 " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "다시 시작" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "하세요" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Enter verification code or start over" |
*
* @param {Login_Email_Verification_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_email_verification_title = /** @type {((inputs?: Login_Email_Verification_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & { parts: (inputs?: Login_Email_Verification_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Login_Email_Verification_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Login_Email_Verification_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_login_email_verification_title(inputs)
			if (locale === "es") return es_login_email_verification_title(inputs)
			if (locale === "de") return de_login_email_verification_title(inputs)
			if (locale === "ar") return ar_login_email_verification_title(inputs)
			if (locale === "fr") return fr_login_email_verification_title(inputs)
			return ko_login_email_verification_title(inputs)
		}),
		{
			parts: /** @type {(inputs?: Login_Email_Verification_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_login_email_verification_title.parts === "function" ? en_login_email_verification_title.parts(inputs) : [{ type: "text", value: en_login_email_verification_title(inputs) }]
				if (locale === "es") return typeof es_login_email_verification_title.parts === "function" ? es_login_email_verification_title.parts(inputs) : [{ type: "text", value: es_login_email_verification_title(inputs) }]
				if (locale === "de") return typeof de_login_email_verification_title.parts === "function" ? de_login_email_verification_title.parts(inputs) : [{ type: "text", value: de_login_email_verification_title(inputs) }]
				if (locale === "ar") return typeof ar_login_email_verification_title.parts === "function" ? ar_login_email_verification_title.parts(inputs) : [{ type: "text", value: ar_login_email_verification_title(inputs) }]
				if (locale === "fr") return typeof fr_login_email_verification_title.parts === "function" ? fr_login_email_verification_title.parts(inputs) : [{ type: "text", value: fr_login_email_verification_title(inputs) }]
				return typeof ko_login_email_verification_title.parts === "function" ? ko_login_email_verification_title.parts(inputs) : [{ type: "text", value: ko_login_email_verification_title(inputs) }]
			})
		}
	)
);
export { login_email_verification_title as "login.email.verification.title" }