/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Role_Developer_TitleInputs */

const en_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer`)
};

const es_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desarrollador`)
};

const de_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entwickler`)
};

const ar_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطور`)
};

const fr_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Développeur`)
};

const ko_onboarding_role_developer_title = /** @type {(inputs: Onboarding_Role_Developer_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개발자`)
};

/**
* | output |
* | --- |
* | "Developer" |
*
* @param {Onboarding_Role_Developer_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_role_developer_title = /** @type {((inputs?: Onboarding_Role_Developer_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Role_Developer_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_role_developer_title(inputs)
	if (locale === "es") return es_onboarding_role_developer_title(inputs)
	if (locale === "de") return de_onboarding_role_developer_title(inputs)
	if (locale === "ar") return ar_onboarding_role_developer_title(inputs)
	if (locale === "fr") return fr_onboarding_role_developer_title(inputs)
	return ko_onboarding_role_developer_title(inputs)
});
export { onboarding_role_developer_title as "onboarding.role.developer.title" }