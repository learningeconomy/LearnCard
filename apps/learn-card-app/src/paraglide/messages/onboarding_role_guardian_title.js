/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Guardian_TitleInputs */

const en_onboarding_role_guardian_title = /** @type {(inputs: Onboarding_Role_Guardian_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardian`)
};

const es_onboarding_role_guardian_title = /** @type {(inputs: Onboarding_Role_Guardian_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tutor`)
};

const fr_onboarding_role_guardian_title = /** @type {(inputs: Onboarding_Role_Guardian_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tuteur`)
};

const ar_onboarding_role_guardian_title = /** @type {(inputs: Onboarding_Role_Guardian_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ولي أمر`)
};

/**
* | output |
* | --- |
* | "Guardian" |
*
* @param {Onboarding_Role_Guardian_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_role_guardian_title = /** @type {((inputs?: Onboarding_Role_Guardian_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Guardian_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_guardian_title(inputs)
	if (locale === "es") return es_onboarding_role_guardian_title(inputs)
	if (locale === "fr") return fr_onboarding_role_guardian_title(inputs)
	return ar_onboarding_role_guardian_title(inputs)
});
export { onboarding_role_guardian_title as "onboarding.role.guardian.title" }