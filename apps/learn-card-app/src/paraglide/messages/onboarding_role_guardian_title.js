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

const de_onboarding_role_guardian_title = /** @type {(inputs: Onboarding_Role_Guardian_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erziehungsberechtigter`)
};

const ar_onboarding_role_guardian_title = /** @type {(inputs: Onboarding_Role_Guardian_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ولي أمر`)
};

const fr_onboarding_role_guardian_title = /** @type {(inputs: Onboarding_Role_Guardian_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tuteur`)
};

const ko_onboarding_role_guardian_title = /** @type {(inputs: Onboarding_Role_Guardian_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`보호자`)
};

/**
* | output |
* | --- |
* | "Guardian" |
*
* @param {Onboarding_Role_Guardian_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_guardian_title = /** @type {((inputs?: Onboarding_Role_Guardian_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Guardian_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_guardian_title(inputs)
	if (locale === "es") return es_onboarding_role_guardian_title(inputs)
	if (locale === "de") return de_onboarding_role_guardian_title(inputs)
	if (locale === "ar") return ar_onboarding_role_guardian_title(inputs)
	if (locale === "fr") return fr_onboarding_role_guardian_title(inputs)
	return ko_onboarding_role_guardian_title(inputs)
});
export { onboarding_role_guardian_title as "onboarding.role.guardian.title" }