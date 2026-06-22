/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Advancedoption2Inputs */

const en_login_seedphrase_advancedoption2 = /** @type {((inputs: Login_Seedphrase_Advancedoption2Inputs) => LocalizedString) & { parts: (inputs: Login_Seedphrase_Advancedoption2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Seedphrase_Advancedoption2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`This is an advanced option for users who already saved their seed during passport creation. If you don't have a seed, you will need to go back and create a new passport instead.`)
		}),
		{
			parts: /** @type {(inputs: Login_Seedphrase_Advancedoption2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "This is an advanced option for users who already saved their seed during passport creation. If you don't have a seed, you will need to go back and " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "create a new passport" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " instead." }])
			})
		}
	)
);

const es_login_seedphrase_advancedoption2 = /** @type {((inputs: Login_Seedphrase_Advancedoption2Inputs) => LocalizedString) & { parts: (inputs: Login_Seedphrase_Advancedoption2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Seedphrase_Advancedoption2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Esta es una opción avanzada para usuarios que ya guardaron su semilla al crear el pasaporte. Si no tienes una semilla, deberás volver y crear un nuevo pasaporte.`)
		}),
		{
			parts: /** @type {(inputs: Login_Seedphrase_Advancedoption2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Esta es una opción avanzada para usuarios que ya guardaron su semilla al crear el pasaporte. Si no tienes una semilla, deberás volver y " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "crear un nuevo pasaporte" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const fr_login_seedphrase_advancedoption2 = /** @type {((inputs: Login_Seedphrase_Advancedoption2Inputs) => LocalizedString) & { parts: (inputs: Login_Seedphrase_Advancedoption2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Seedphrase_Advancedoption2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Ceci est une option avancée pour les utilisateurs ayant déjà sauvegardé leur phrase lors de la création du passeport. Si vous n'avez pas de phrase, vous devrez revenir en arrière et créer un nouveau passeport.`)
		}),
		{
			parts: /** @type {(inputs: Login_Seedphrase_Advancedoption2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Ceci est une option avancée pour les utilisateurs ayant déjà sauvegardé leur phrase lors de la création du passeport. Si vous n'avez pas de phrase, vous devrez revenir en arrière et " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "créer un nouveau passeport" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: "." }])
			})
		}
	)
);

const ar_login_seedphrase_advancedoption2 = /** @type {((inputs: Login_Seedphrase_Advancedoption2Inputs) => LocalizedString) & { parts: (inputs: Login_Seedphrase_Advancedoption2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Login_Seedphrase_Advancedoption2Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`هذا خيار متقدم للمستخدمين الذين حفظوا عبارة الاسترداد بالفعل أثناء إنشاء جواز السفر. إذا لم يكن لديك عبارة استرداد، فستحتاج إلى العودة و إنشاء جواز سفر جديد بدلاً من ذلك.`)
		}),
		{
			parts: /** @type {(inputs: Login_Seedphrase_Advancedoption2Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "هذا خيار متقدم للمستخدمين الذين حفظوا عبارة الاسترداد بالفعل أثناء إنشاء جواز السفر. إذا لم يكن لديك عبارة استرداد، فستحتاج إلى العودة و " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "إنشاء جواز سفر جديد" }, { type: "markup-end", name: "0", options: {}, attributes: {} }, { type: "text", value: " بدلاً من ذلك." }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "This is an advanced option for users who already saved their seed during passport creation. If you don't have a seed, you will need to go back and create a n..." |
*
* @param {Login_Seedphrase_Advancedoption2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_advancedoption2 = /** @type {((inputs?: Login_Seedphrase_Advancedoption2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Login_Seedphrase_Advancedoption2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Login_Seedphrase_Advancedoption2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Login_Seedphrase_Advancedoption2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_login_seedphrase_advancedoption2(inputs)
			if (locale === "es") return es_login_seedphrase_advancedoption2(inputs)
			if (locale === "fr") return fr_login_seedphrase_advancedoption2(inputs)
			return ar_login_seedphrase_advancedoption2(inputs)
		}),
		{
			parts: /** @type {(inputs?: Login_Seedphrase_Advancedoption2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_login_seedphrase_advancedoption2.parts === "function" ? en_login_seedphrase_advancedoption2.parts(inputs) : [{ type: "text", value: en_login_seedphrase_advancedoption2(inputs) }]
				if (locale === "es") return typeof es_login_seedphrase_advancedoption2.parts === "function" ? es_login_seedphrase_advancedoption2.parts(inputs) : [{ type: "text", value: es_login_seedphrase_advancedoption2(inputs) }]
				if (locale === "fr") return typeof fr_login_seedphrase_advancedoption2.parts === "function" ? fr_login_seedphrase_advancedoption2.parts(inputs) : [{ type: "text", value: fr_login_seedphrase_advancedoption2(inputs) }]
				return typeof ar_login_seedphrase_advancedoption2.parts === "function" ? ar_login_seedphrase_advancedoption2.parts(inputs) : [{ type: "text", value: ar_login_seedphrase_advancedoption2(inputs) }]
			})
		}
	)
);
export { login_seedphrase_advancedoption2 as "login.seedPhrase.advancedOption" }