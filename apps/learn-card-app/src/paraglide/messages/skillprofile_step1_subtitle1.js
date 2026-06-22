/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step1_Subtitle1Inputs */

const en_skillprofile_step1_subtitle1 = /** @type {((inputs: Skillprofile_Step1_Subtitle1Inputs) => LocalizedString) & { parts: (inputs: Skillprofile_Step1_Subtitle1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillprofile_Step1_Subtitle1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Your profile is used to create personalized opportunities. All your answers are confidential.`)
		}),
		{
			parts: /** @type {(inputs: Skillprofile_Step1_Subtitle1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Your profile is used to create personalized opportunities. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "All your answers are confidential." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_skillprofile_step1_subtitle1 = /** @type {((inputs: Skillprofile_Step1_Subtitle1Inputs) => LocalizedString) & { parts: (inputs: Skillprofile_Step1_Subtitle1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillprofile_Step1_Subtitle1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Tu perfil se usa para crear oportunidades personalizadas. Todas tus respuestas son confidenciales.`)
		}),
		{
			parts: /** @type {(inputs: Skillprofile_Step1_Subtitle1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Tu perfil se usa para crear oportunidades personalizadas. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Todas tus respuestas son confidenciales." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_skillprofile_step1_subtitle1 = /** @type {((inputs: Skillprofile_Step1_Subtitle1Inputs) => LocalizedString) & { parts: (inputs: Skillprofile_Step1_Subtitle1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillprofile_Step1_Subtitle1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`Votre profil sert à créer des opportunités personnalisées. Toutes vos réponses sont confidentielles.`)
		}),
		{
			parts: /** @type {(inputs: Skillprofile_Step1_Subtitle1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Votre profil sert à créer des opportunités personnalisées. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "Toutes vos réponses sont confidentielles." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_skillprofile_step1_subtitle1 = /** @type {((inputs: Skillprofile_Step1_Subtitle1Inputs) => LocalizedString) & { parts: (inputs: Skillprofile_Step1_Subtitle1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Skillprofile_Step1_Subtitle1Inputs) => LocalizedString} */ (() => {
			return /** @type {LocalizedString} */ (`يُستخدم ملفك لإنشاء فرص مخصّصة. جميع إجاباتك سرّية.`)
		}),
		{
			parts: /** @type {(inputs: Skillprofile_Step1_Subtitle1Inputs) => import('../runtime.js').MessagePart[]} */ (() => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "يُستخدم ملفك لإنشاء فرص مخصّصة. " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: "جميع إجاباتك سرّية." }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "Your profile is used to create personalized opportunities. All your answers are confidential." |
*
* @param {Skillprofile_Step1_Subtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step1_subtitle1 = /** @type {((inputs?: Skillprofile_Step1_Subtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs?: Skillprofile_Step1_Subtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Skillprofile_Step1_Subtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs?: Skillprofile_Step1_Subtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs = {}, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_skillprofile_step1_subtitle1(inputs)
			if (locale === "es") return es_skillprofile_step1_subtitle1(inputs)
			if (locale === "fr") return fr_skillprofile_step1_subtitle1(inputs)
			return ar_skillprofile_step1_subtitle1(inputs)
		}),
		{
			parts: /** @type {(inputs?: Skillprofile_Step1_Subtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs = {}, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_skillprofile_step1_subtitle1.parts === "function" ? en_skillprofile_step1_subtitle1.parts(inputs) : [{ type: "text", value: en_skillprofile_step1_subtitle1(inputs) }]
				if (locale === "es") return typeof es_skillprofile_step1_subtitle1.parts === "function" ? es_skillprofile_step1_subtitle1.parts(inputs) : [{ type: "text", value: es_skillprofile_step1_subtitle1(inputs) }]
				if (locale === "fr") return typeof fr_skillprofile_step1_subtitle1.parts === "function" ? fr_skillprofile_step1_subtitle1.parts(inputs) : [{ type: "text", value: fr_skillprofile_step1_subtitle1(inputs) }]
				return typeof ar_skillprofile_step1_subtitle1.parts === "function" ? ar_skillprofile_step1_subtitle1.parts(inputs) : [{ type: "text", value: ar_skillprofile_step1_subtitle1(inputs) }]
			})
		}
	)
);
export { skillprofile_step1_subtitle1 as "skillProfile.step1.subtitle" }