/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ appName: NonNullable<unknown> }} Onboarding_Profile_Installbanner1Inputs */

const en_onboarding_profile_installbanner1 = /** @type {((inputs: Onboarding_Profile_Installbanner1Inputs) => LocalizedString) & { parts: (inputs: Onboarding_Profile_Installbanner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Profile_Installbanner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`After creating your account, you'll be able to install ${i?.appName}`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Profile_Installbanner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "After creating your account, you'll be able to install " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const es_onboarding_profile_installbanner1 = /** @type {((inputs: Onboarding_Profile_Installbanner1Inputs) => LocalizedString) & { parts: (inputs: Onboarding_Profile_Installbanner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Profile_Installbanner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Después de crear tu cuenta, podrás instalar ${i?.appName}`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Profile_Installbanner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Después de crear tu cuenta, podrás instalar " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const fr_onboarding_profile_installbanner1 = /** @type {((inputs: Onboarding_Profile_Installbanner1Inputs) => LocalizedString) & { parts: (inputs: Onboarding_Profile_Installbanner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Profile_Installbanner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`Après avoir créé votre compte, vous pourrez installer ${i?.appName}`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Profile_Installbanner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "Après avoir créé votre compte, vous pourrez installer " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

const ar_onboarding_profile_installbanner1 = /** @type {((inputs: Onboarding_Profile_Installbanner1Inputs) => LocalizedString) & { parts: (inputs: Onboarding_Profile_Installbanner1Inputs) => import('../runtime.js').MessagePart[] }} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Profile_Installbanner1Inputs) => LocalizedString} */ ((i) => {
			return /** @type {LocalizedString} */ (`بعد إنشاء حسابك، ستتمكن من تثبيت ${i?.appName}`)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Profile_Installbanner1Inputs) => import('../runtime.js').MessagePart[]} */ ((i) => {
				return /** @type {import('../runtime.js').MessagePart[]} */ ([{ type: "text", value: "بعد إنشاء حسابك، ستتمكن من تثبيت " }, { type: "markup-start", name: "0", options: {}, attributes: {} }, { type: "text", value: String(i?.appName) }, { type: "markup-end", name: "0", options: {}, attributes: {} }])
			})
		}
	)
);

/**
* | output |
* | --- |
* | "After creating your account, you'll be able to install {appName}" |
*
* @param {Onboarding_Profile_Installbanner1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_installbanner1 = /** @type {((inputs: Onboarding_Profile_Installbanner1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & { parts: (inputs: Onboarding_Profile_Installbanner1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Onboarding_Profile_Installbanner1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, { "0": { options: {}; attributes: {}; children: true } }>} */ (
	/* @__PURE__ */ Object.assign(
		/** @type {(inputs: Onboarding_Profile_Installbanner1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString} */ ((inputs, options = {}) => {
			const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
			if (locale === "en") return en_onboarding_profile_installbanner1(inputs)
			if (locale === "es") return es_onboarding_profile_installbanner1(inputs)
			if (locale === "fr") return fr_onboarding_profile_installbanner1(inputs)
			return ar_onboarding_profile_installbanner1(inputs)
		}),
		{
			parts: /** @type {(inputs: Onboarding_Profile_Installbanner1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => import('../runtime.js').MessagePart[]} */ ((inputs, options = {}) => {
				const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
				if (locale === "en") return typeof en_onboarding_profile_installbanner1.parts === "function" ? en_onboarding_profile_installbanner1.parts(inputs) : [{ type: "text", value: en_onboarding_profile_installbanner1(inputs) }]
				if (locale === "es") return typeof es_onboarding_profile_installbanner1.parts === "function" ? es_onboarding_profile_installbanner1.parts(inputs) : [{ type: "text", value: es_onboarding_profile_installbanner1(inputs) }]
				if (locale === "fr") return typeof fr_onboarding_profile_installbanner1.parts === "function" ? fr_onboarding_profile_installbanner1.parts(inputs) : [{ type: "text", value: fr_onboarding_profile_installbanner1(inputs) }]
				return typeof ar_onboarding_profile_installbanner1.parts === "function" ? ar_onboarding_profile_installbanner1.parts(inputs) : [{ type: "text", value: ar_onboarding_profile_installbanner1(inputs) }]
			})
		}
	)
);
export { onboarding_profile_installbanner1 as "onboarding.profile.installBanner" }