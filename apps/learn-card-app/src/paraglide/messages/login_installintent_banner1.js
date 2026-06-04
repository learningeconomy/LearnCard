/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ appName: NonNullable<unknown> }} Login_Installintent_Banner1Inputs */

const en_login_installintent_banner1 = /** @type {((inputs: Login_Installintent_Banner1Inputs) => LocalizedString) & { parts: (inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Installintent_Banner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`You'll be taken back to ${i?.appName} after sign in`)
		}),
		{
			parts: /** @type {(inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "You'll be taken back to " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " after sign in" }])
			})
		}
	)
);

const es_login_installintent_banner1 = /** @type {((inputs: Login_Installintent_Banner1Inputs) => LocalizedString) & { parts: (inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Installintent_Banner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Volverás a ${i?.appName} después de iniciar sesión`)
		}),
		{
			parts: /** @type {(inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Volverás a " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " después de iniciar sesión" }])
			})
		}
	)
);

const de_login_installintent_banner1 = /** @type {((inputs: Login_Installintent_Banner1Inputs) => LocalizedString) & { parts: (inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Installintent_Banner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Du wirst nach der Anmeldung zu ${i?.appName} zurückgeleitet`)
		}),
		{
			parts: /** @type {(inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Du wirst nach der Anmeldung zu " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " zurückgeleitet" }])
			})
		}
	)
);

const ar_login_installintent_banner1 = /** @type {((inputs: Login_Installintent_Banner1Inputs) => LocalizedString) & { parts: (inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Installintent_Banner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`سيتم إعادتك إلى ${i?.appName} بعد تسجيل الدخول`)
		}),
		{
			parts: /** @type {(inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "سيتم إعادتك إلى " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " بعد تسجيل الدخول" }])
			})
		}
	)
);

const fr_login_installintent_banner1 = /** @type {((inputs: Login_Installintent_Banner1Inputs) => LocalizedString) & { parts: (inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Installintent_Banner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Vous serez redirigé vers ${i?.appName} après la connexion`)
		}),
		{
			parts: /** @type {(inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Vous serez redirigé vers " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " après la connexion" }])
			})
		}
	)
);

const ko_login_installintent_banner1 = /** @type {((inputs: Login_Installintent_Banner1Inputs) => LocalizedString) & { parts: (inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Installintent_Banner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`로그인 후 ${i?.appName}(으)로 돌아갑니다`)
		}),
		{
			parts: /** @type {(inputs: Login_Installintent_Banner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "로그인 후 " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "(으)로 돌아갑니다" }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "You'll be taken back to {appName} after sign in" |
*
* @param {Login_Installintent_Banner1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_installintent_banner1 = /** @type {((inputs: Login_Installintent_Banner1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & { parts: (inputs: Login_Installintent_Banner1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Login_Installintent_Banner1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Installintent_Banner1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_login_installintent_banner1(inputs)
			if (locale === "es") return es_login_installintent_banner1(inputs)
			if (locale === "de") return de_login_installintent_banner1(inputs)
			if (locale === "ar") return ar_login_installintent_banner1(inputs)
			if (locale === "fr") return fr_login_installintent_banner1(inputs)
			return ko_login_installintent_banner1(inputs)
		}),
		{
			parts: /** @type {(inputs: Login_Installintent_Banner1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_login_installintent_banner1.parts === "function" ? en_login_installintent_banner1.parts(inputs) : [{ type: "text", value: en_login_installintent_banner1(inputs) }]
				if (locale === "es") return typeof es_login_installintent_banner1.parts === "function" ? es_login_installintent_banner1.parts(inputs) : [{ type: "text", value: es_login_installintent_banner1(inputs) }]
				if (locale === "de") return typeof de_login_installintent_banner1.parts === "function" ? de_login_installintent_banner1.parts(inputs) : [{ type: "text", value: de_login_installintent_banner1(inputs) }]
				if (locale === "ar") return typeof ar_login_installintent_banner1.parts === "function" ? ar_login_installintent_banner1.parts(inputs) : [{ type: "text", value: ar_login_installintent_banner1(inputs) }]
				if (locale === "fr") return typeof fr_login_installintent_banner1.parts === "function" ? fr_login_installintent_banner1.parts(inputs) : [{ type: "text", value: fr_login_installintent_banner1(inputs) }]
				return typeof ko_login_installintent_banner1.parts === "function" ? ko_login_installintent_banner1.parts(inputs) : [{ type: "text", value: ko_login_installintent_banner1(inputs) }]
			})
		}
	)
);
export { login_installintent_banner1 as "login.installIntent.banner" }