/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown>, marca: NonNullable<unknown>, marque: NonNullable<unknown>, "علامتك التجارية": NonNullable<unknown> }} Profile_Export_Masterkeywarning2Inputs */

const en_profile_export_masterkeywarning2 = /** @type {((inputs: Profile_Export_Masterkeywarning2Inputs) => LocalizedString) & { parts: (inputs: Profile_Export_Masterkeywarning2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Export_Masterkeywarning2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`This is your ${i?.brand}'s master key. Anyone with access to this phrase can control your ${i?.brand} and your identity. - Do NOT share it. - Do NOT store it online or take screenshots. - Write it down and store it offline. - If you lose this, you may permanently lose access. Are you sure you want to proceed?`)
		}),
		{
			parts: /** @type {(inputs: Profile_Export_Masterkeywarning2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "This is your " }, { type: "text", value: String(i?.brand) }, { type: "text", value: "'s master key. Anyone with access to this phrase can control your " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " and your identity. - Do NOT share it. - Do NOT store it online or take screenshots. - Write it down and store it offline. - If you lose this, you may permanently lose access. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Are you sure you want to proceed?" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_profile_export_masterkeywarning2 = /** @type {((inputs: Profile_Export_Masterkeywarning2Inputs) => LocalizedString) & { parts: (inputs: Profile_Export_Masterkeywarning2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Export_Masterkeywarning2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Esta es la clave maestra de tu ${i?.marca}. Cualquiera que tenga acceso a esta frase puede controlar su ${i?.marca} y su identidad. - NO lo compartas. - NO lo almacene en línea ni tome capturas de pantalla. - Anótelo y guárdelo sin conexión. - Si lo pierdes, es posible que pierdas el acceso de forma permanente. ¿Está seguro de que desea continuar?`)
		}),
		{
			parts: /** @type {(inputs: Profile_Export_Masterkeywarning2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Esta es la clave maestra de tu " }, { type: "text", value: String(i?.marca) }, { type: "text", value: ". Cualquiera que tenga acceso a esta frase puede controlar su " }, { type: "text", value: String(i?.marca) }, { type: "text", value: " y su identidad. - NO lo compartas. - NO lo almacene en línea ni tome capturas de pantalla. - Anótelo y guárdelo sin conexión. - Si lo pierdes, es posible que pierdas el acceso de forma permanente. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "¿Está seguro de que desea continuar?" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_profile_export_masterkeywarning2 = /** @type {((inputs: Profile_Export_Masterkeywarning2Inputs) => LocalizedString) & { parts: (inputs: Profile_Export_Masterkeywarning2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Export_Masterkeywarning2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Il s'agit de la clé principale de votre ${i?.brand}. Toute personne ayant accès à cette phrase peut contrôler votre ${i?.marque} et votre identité. - Ne le partagez PAS. - Ne le stockez PAS en ligne et ne prenez pas de captures d'écran. - Notez-le et stockez-le hors ligne. - Si vous le perdez, vous risquez de perdre définitivement l'accès. Êtes-vous sûr de vouloir continuer ?`)
		}),
		{
			parts: /** @type {(inputs: Profile_Export_Masterkeywarning2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Il s'agit de la clé principale de votre " }, { type: "text", value: String(i?.brand) }, { type: "text", value: ". Toute personne ayant accès à cette phrase peut contrôler votre " }, { type: "text", value: String(i?.marque) }, { type: "text", value: " et votre identité. - Ne le partagez PAS. - Ne le stockez PAS en ligne et ne prenez pas de captures d'écran. - Notez-le et stockez-le hors ligne. - Si vous le perdez, vous risquez de perdre définitivement l'accès. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Êtes-vous sûr de vouloir continuer ?" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_profile_export_masterkeywarning2 = /** @type {((inputs: Profile_Export_Masterkeywarning2Inputs) => LocalizedString) & { parts: (inputs: Profile_Export_Masterkeywarning2Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Export_Masterkeywarning2Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`هذا هو المفتاح الرئيسي لـ ${i?.brand} الخاص بك. يمكن لأي شخص لديه حق الوصول إلى هذه العبارة التحكم في ${i?.["علامتك التجارية"]} وهويتك. - لا تشاركه. - لا تقم بتخزينه على الإنترنت أو التقاط لقطات الشاشة. - اكتبها واحفظها في وضع عدم الاتصال. - إذا فقدت هذا، فقد تفقد إمكانية الوصول بشكل دائم. هل أنت متأكد من رغبتك في المتابعة؟`)
		}),
		{
			parts: /** @type {(inputs: Profile_Export_Masterkeywarning2Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "هذا هو المفتاح الرئيسي لـ " }, { type: "text", value: String(i?.brand) }, { type: "text", value: " الخاص بك. يمكن لأي شخص لديه حق الوصول إلى هذه العبارة التحكم في " }, { type: "text", value: String(i?.["علامتك التجارية"]) }, { type: "text", value: " وهويتك. - لا تشاركه. - لا تقم بتخزينه على الإنترنت أو التقاط لقطات الشاشة. - اكتبها واحفظها في وضع عدم الاتصال. - إذا فقدت هذا، فقد تفقد إمكانية الوصول بشكل دائم. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "هل أنت متأكد من رغبتك في المتابعة؟" }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "This is your {brand}'s master key. Anyone with access to this phrase can control your {brand} and your identity. - Do NOT share it. - Do NOT store it online ..." |
*
* @param {Profile_Export_Masterkeywarning2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_export_masterkeywarning2 = /** @type {((inputs: Profile_Export_Masterkeywarning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Profile_Export_Masterkeywarning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Profile_Export_Masterkeywarning2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Profile_Export_Masterkeywarning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_profile_export_masterkeywarning2(inputs)
			if (locale === "es") return es_profile_export_masterkeywarning2(inputs)
			if (locale === "fr") return fr_profile_export_masterkeywarning2(inputs)
			return ar_profile_export_masterkeywarning2(inputs)
		}),
		{
			parts: /** @type {(inputs: Profile_Export_Masterkeywarning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_profile_export_masterkeywarning2.parts === "function" ? en_profile_export_masterkeywarning2.parts(inputs) : [{ type: "text", value: en_profile_export_masterkeywarning2(inputs) }]
				if (locale === "es") return typeof es_profile_export_masterkeywarning2.parts === "function" ? es_profile_export_masterkeywarning2.parts(inputs) : [{ type: "text", value: es_profile_export_masterkeywarning2(inputs) }]
				if (locale === "fr") return typeof fr_profile_export_masterkeywarning2.parts === "function" ? fr_profile_export_masterkeywarning2.parts(inputs) : [{ type: "text", value: fr_profile_export_masterkeywarning2(inputs) }]
				return typeof ar_profile_export_masterkeywarning2.parts === "function" ? ar_profile_export_masterkeywarning2.parts(inputs) : [{ type: "text", value: ar_profile_export_masterkeywarning2(inputs) }]
			})
		}
	)
);
export { profile_export_masterkeywarning2 as "profile.export.masterKeyWarning" }