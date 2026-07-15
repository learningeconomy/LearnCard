/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Worldscoutsaccount2Inputs */

const en_login_worldscoutsaccount2 = /** @type {((inputs: Login_Worldscoutsaccount2Inputs) => LocalizedString) & { parts: (inputs: Login_Worldscoutsaccount2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Worldscoutsaccount2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Login with your World Scouts Account`)
		}),
		{
			parts: /** @type {(inputs: Login_Worldscoutsaccount2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Login with your " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "World Scouts Account" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_login_worldscoutsaccount2 = /** @type {((inputs: Login_Worldscoutsaccount2Inputs) => LocalizedString) & { parts: (inputs: Login_Worldscoutsaccount2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Worldscoutsaccount2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Inicia sesión con tu Cuenta de World Scouts`)
		}),
		{
			parts: /** @type {(inputs: Login_Worldscoutsaccount2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Inicia sesión con tu " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Cuenta de World Scouts" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_login_worldscoutsaccount2 = /** @type {((inputs: Login_Worldscoutsaccount2Inputs) => LocalizedString) & { parts: (inputs: Login_Worldscoutsaccount2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Worldscoutsaccount2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Connectez-vous avec votre Compte World Scouts`)
		}),
		{
			parts: /** @type {(inputs: Login_Worldscoutsaccount2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Connectez-vous avec votre " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Compte World Scouts" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_login_worldscoutsaccount2 = /** @type {((inputs: Login_Worldscoutsaccount2Inputs) => LocalizedString) & { parts: (inputs: Login_Worldscoutsaccount2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Worldscoutsaccount2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`تسجيل الدخول باستخدام حساب الكشافة العالمي الخاص بك`)
		}),
		{
			parts: /** @type {(inputs: Login_Worldscoutsaccount2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "تسجيل الدخول باستخدام " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "حساب الكشافة العالمي" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " الخاص بك" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Login with your World Scouts Account" |
*
* @param {Login_Worldscoutsaccount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_worldscoutsaccount2 = /** @type {((inputs?: Login_Worldscoutsaccount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Login_Worldscoutsaccount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Login_Worldscoutsaccount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Login_Worldscoutsaccount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_login_worldscoutsaccount2(inputs)
			if (locale === "es") return es_login_worldscoutsaccount2(inputs)
			if (locale === "fr") return fr_login_worldscoutsaccount2(inputs)
			return ar_login_worldscoutsaccount2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Login_Worldscoutsaccount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_login_worldscoutsaccount2.parts === "function" ? en_login_worldscoutsaccount2.parts(inputs) : [{ type: "text", value: en_login_worldscoutsaccount2(inputs) }]
				if (locale === "es") return typeof es_login_worldscoutsaccount2.parts === "function" ? es_login_worldscoutsaccount2.parts(inputs) : [{ type: "text", value: es_login_worldscoutsaccount2(inputs) }]
				if (locale === "fr") return typeof fr_login_worldscoutsaccount2.parts === "function" ? fr_login_worldscoutsaccount2.parts(inputs) : [{ type: "text", value: fr_login_worldscoutsaccount2(inputs) }]
				return typeof ar_login_worldscoutsaccount2.parts === "function" ? ar_login_worldscoutsaccount2.parts(inputs) : [{ type: "text", value: ar_login_worldscoutsaccount2(inputs) }]
			})
		}
	)
);
export { login_worldscoutsaccount2 as "login.worldScoutsAccount" }