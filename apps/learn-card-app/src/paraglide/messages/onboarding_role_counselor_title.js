/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Counselor_TitleInputs */

const en_onboarding_role_counselor_title = /** @type {(inputs: Onboarding_Role_Counselor_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guidance Counselor`)
};

const es_onboarding_role_counselor_title = /** @type {(inputs: Onboarding_Role_Counselor_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Orientador`)
};

const de_onboarding_role_counselor_title = /** @type {(inputs: Onboarding_Role_Counselor_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beratungslehrer`)
};

const ar_onboarding_role_counselor_title = /** @type {(inputs: Onboarding_Role_Counselor_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرشد`)
};

const fr_onboarding_role_counselor_title = /** @type {(inputs: Onboarding_Role_Counselor_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conseiller d'orientation`)
};

const ko_onboarding_role_counselor_title = /** @type {(inputs: Onboarding_Role_Counselor_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`진로 상담사`)
};

/**
* | output |
* | --- |
* | "Guidance Counselor" |
*
* @param {Onboarding_Role_Counselor_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_counselor_title = /** @type {((inputs?: Onboarding_Role_Counselor_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Counselor_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_counselor_title(inputs)
	if (locale === "es") return es_onboarding_role_counselor_title(inputs)
	if (locale === "de") return de_onboarding_role_counselor_title(inputs)
	if (locale === "ar") return ar_onboarding_role_counselor_title(inputs)
	if (locale === "fr") return fr_onboarding_role_counselor_title(inputs)
	return ko_onboarding_role_counselor_title(inputs)
});
export { onboarding_role_counselor_title as "onboarding.role.counselor.title" }