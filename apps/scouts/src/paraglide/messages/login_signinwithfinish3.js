/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Login_Signinwithfinish3Inputs */

const en_login_signinwithfinish3 = /** @type {((inputs: Login_Signinwithfinish3Inputs) => LocalizedString) & { parts: (inputs: Login_Signinwithfinish3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Signinwithfinish3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Sign in with ${i?.name} to finish`)
		}),
		{
			parts: /** @type {(inputs: Login_Signinwithfinish3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Sign in with " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " to finish" }])
			})
		}
	)
);

const es_login_signinwithfinish3 = /** @type {((inputs: Login_Signinwithfinish3Inputs) => LocalizedString) & { parts: (inputs: Login_Signinwithfinish3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Signinwithfinish3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Inicia sesión con ${i?.name} para finalizar`)
		}),
		{
			parts: /** @type {(inputs: Login_Signinwithfinish3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Inicia sesión con " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " para finalizar" }])
			})
		}
	)
);

const fr_login_signinwithfinish3 = /** @type {((inputs: Login_Signinwithfinish3Inputs) => LocalizedString) & { parts: (inputs: Login_Signinwithfinish3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Signinwithfinish3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Connectez-vous avec ${i?.name} pour terminer`)
		}),
		{
			parts: /** @type {(inputs: Login_Signinwithfinish3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Connectez-vous avec " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " pour terminer" }])
			})
		}
	)
);

const ar_login_signinwithfinish3 = /** @type {((inputs: Login_Signinwithfinish3Inputs) => LocalizedString) & { parts: (inputs: Login_Signinwithfinish3Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Signinwithfinish3Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Sign in with ${i?.name} to finish`)
		}),
		{
			parts: /** @type {(inputs: Login_Signinwithfinish3Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Sign in with " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.name) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " to finish" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Sign in with {name} to finish" |
*
* @param {Login_Signinwithfinish3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_signinwithfinish3 = /** @type {((inputs: Login_Signinwithfinish3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Login_Signinwithfinish3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Login_Signinwithfinish3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Signinwithfinish3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_login_signinwithfinish3(inputs)
			if (locale === "es") return es_login_signinwithfinish3(inputs)
			if (locale === "fr") return fr_login_signinwithfinish3(inputs)
			return ar_login_signinwithfinish3(inputs)
		}),
		{
			parts: /** @type {(inputs: Login_Signinwithfinish3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_login_signinwithfinish3.parts === "function" ? en_login_signinwithfinish3.parts(inputs) : [{ type: "text", value: en_login_signinwithfinish3(inputs) }]
				if (locale === "es") return typeof es_login_signinwithfinish3.parts === "function" ? es_login_signinwithfinish3.parts(inputs) : [{ type: "text", value: es_login_signinwithfinish3(inputs) }]
				if (locale === "fr") return typeof fr_login_signinwithfinish3.parts === "function" ? fr_login_signinwithfinish3.parts(inputs) : [{ type: "text", value: fr_login_signinwithfinish3(inputs) }]
				return typeof ar_login_signinwithfinish3.parts === "function" ? ar_login_signinwithfinish3.parts(inputs) : [{ type: "text", value: ar_login_signinwithfinish3(inputs) }]
			})
		}
	)
);
export { login_signinwithfinish3 as "login.signInWithFinish" }