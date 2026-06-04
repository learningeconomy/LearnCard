/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Agerestriction_Notmeetrequirement3Inputs */

const en_launchpad_agerestriction_notmeetrequirement3 = /** @type {(inputs: Launchpad_Agerestriction_Notmeetrequirement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Based on your profile's date of birth, you do not meet the minimum age requirement for this app.`)
};

const es_launchpad_agerestriction_notmeetrequirement3 = /** @type {(inputs: Launchpad_Agerestriction_Notmeetrequirement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Según la fecha de nacimiento de tu perfil, no cumples con el requisito de edad mínima para esta app.`)
};

const de_launchpad_agerestriction_notmeetrequirement3 = /** @type {(inputs: Launchpad_Agerestriction_Notmeetrequirement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Basierend auf dem Geburtsdatum deines Profils erfüllst du die Mindestaltersanforderung für diese App nicht.`)
};

const ar_launchpad_agerestriction_notmeetrequirement3 = /** @type {(inputs: Launchpad_Agerestriction_Notmeetrequirement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بناءً على تاريخ ميلاد ملفك الشخصي، لا تستوفي الحد الأدنى لمتطلبات العمر لهذا التطبيق.`)
};

const fr_launchpad_agerestriction_notmeetrequirement3 = /** @type {(inputs: Launchpad_Agerestriction_Notmeetrequirement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`D'après la date de naissance de votre profil, vous ne répondez pas à l'exigence d'âge minimum pour cette application.`)
};

const ko_launchpad_agerestriction_notmeetrequirement3 = /** @type {(inputs: Launchpad_Agerestriction_Notmeetrequirement3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필의 생년월일을 기반으로 이 앱의 최소 연령 요건을 충족하지 않습니다.`)
};

/**
* | output |
* | --- |
* | "Based on your profile's date of birth, you do not meet the minimum age requirement for this app." |
*
* @param {Launchpad_Agerestriction_Notmeetrequirement3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_agerestriction_notmeetrequirement3 = /** @type {((inputs?: Launchpad_Agerestriction_Notmeetrequirement3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Agerestriction_Notmeetrequirement3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_agerestriction_notmeetrequirement3(inputs)
	if (locale === "es") return es_launchpad_agerestriction_notmeetrequirement3(inputs)
	if (locale === "de") return de_launchpad_agerestriction_notmeetrequirement3(inputs)
	if (locale === "ar") return ar_launchpad_agerestriction_notmeetrequirement3(inputs)
	if (locale === "fr") return fr_launchpad_agerestriction_notmeetrequirement3(inputs)
	return ko_launchpad_agerestriction_notmeetrequirement3(inputs)
});
export { launchpad_agerestriction_notmeetrequirement3 as "launchpad.ageRestriction.notMeetRequirement" }