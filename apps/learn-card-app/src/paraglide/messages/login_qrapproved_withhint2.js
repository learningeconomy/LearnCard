/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ hint: NonNullable<unknown> }} Login_Qrapproved_Withhint2Inputs */

const en_login_qrapproved_withhint2 = /** @type {((inputs: Login_Qrapproved_Withhint2Inputs) => LocalizedString) & { parts: (inputs: Login_Qrapproved_Withhint2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Qrapproved_Withhint2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Sign in with ${i?.hint} to access your account.`)
		}),
		{
			parts: /** @type {(inputs: Login_Qrapproved_Withhint2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Sign in with " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.hint) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " to access your account." }])
			})
		}
	)
);

const es_login_qrapproved_withhint2 = /** @type {((inputs: Login_Qrapproved_Withhint2Inputs) => LocalizedString) & { parts: (inputs: Login_Qrapproved_Withhint2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Qrapproved_Withhint2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Inicia sesión con ${i?.hint} para acceder a tu cuenta.`)
		}),
		{
			parts: /** @type {(inputs: Login_Qrapproved_Withhint2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Inicia sesión con " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.hint) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " para acceder a tu cuenta." }])
			})
		}
	)
);

const fr_login_qrapproved_withhint2 = /** @type {((inputs: Login_Qrapproved_Withhint2Inputs) => LocalizedString) & { parts: (inputs: Login_Qrapproved_Withhint2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Qrapproved_Withhint2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Connectez-vous avec ${i?.hint} pour accéder à votre compte.`)
		}),
		{
			parts: /** @type {(inputs: Login_Qrapproved_Withhint2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Connectez-vous avec " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.hint) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " pour accéder à votre compte." }])
			})
		}
	)
);

const ar_login_qrapproved_withhint2 = /** @type {((inputs: Login_Qrapproved_Withhint2Inputs) => LocalizedString) & { parts: (inputs: Login_Qrapproved_Withhint2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Qrapproved_Withhint2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`سجل الدخول باستخدام ${i?.hint} للوصول إلى حسابك.`)
		}),
		{
			parts: /** @type {(inputs: Login_Qrapproved_Withhint2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "سجل الدخول باستخدام " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.hint) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " للوصول إلى حسابك." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Sign in with {hint} to access your account." |
*
* @param {Login_Qrapproved_Withhint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_qrapproved_withhint2 = /** @type {((inputs: Login_Qrapproved_Withhint2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Login_Qrapproved_Withhint2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Login_Qrapproved_Withhint2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Qrapproved_Withhint2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_login_qrapproved_withhint2(inputs)
			if (locale === "es") return es_login_qrapproved_withhint2(inputs)
			if (locale === "fr") return fr_login_qrapproved_withhint2(inputs)
			return ar_login_qrapproved_withhint2(inputs)
		}),
		{
			parts: /** @type {(inputs: Login_Qrapproved_Withhint2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_login_qrapproved_withhint2.parts === "function" ? en_login_qrapproved_withhint2.parts(inputs) : [{ type: "text", value: en_login_qrapproved_withhint2(inputs) }]
				if (locale === "es") return typeof es_login_qrapproved_withhint2.parts === "function" ? es_login_qrapproved_withhint2.parts(inputs) : [{ type: "text", value: es_login_qrapproved_withhint2(inputs) }]
				if (locale === "fr") return typeof fr_login_qrapproved_withhint2.parts === "function" ? fr_login_qrapproved_withhint2.parts(inputs) : [{ type: "text", value: fr_login_qrapproved_withhint2(inputs) }]
				return typeof ar_login_qrapproved_withhint2.parts === "function" ? ar_login_qrapproved_withhint2.parts(inputs) : [{ type: "text", value: ar_login_qrapproved_withhint2(inputs) }]
			})
		}
	)
);
export { login_qrapproved_withhint2 as "login.qrApproved.withHint" }