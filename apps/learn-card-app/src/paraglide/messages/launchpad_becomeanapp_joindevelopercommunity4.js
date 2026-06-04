/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Becomeanapp_Joindevelopercommunity4Inputs */

const en_launchpad_becomeanapp_joindevelopercommunity4 = /** @type {(inputs: Launchpad_Becomeanapp_Joindevelopercommunity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join our developer community today`)
};

const es_launchpad_becomeanapp_joindevelopercommunity4 = /** @type {(inputs: Launchpad_Becomeanapp_Joindevelopercommunity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Únete a nuestra comunidad de desarrolladores hoy`)
};

const de_launchpad_becomeanapp_joindevelopercommunity4 = /** @type {(inputs: Launchpad_Becomeanapp_Joindevelopercommunity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trete heute unserer Entwickler-Community bei`)
};

const ar_launchpad_becomeanapp_joindevelopercommunity4 = /** @type {(inputs: Launchpad_Becomeanapp_Joindevelopercommunity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انضم إلى مجتمع المطورين لدينا اليوم`)
};

const fr_launchpad_becomeanapp_joindevelopercommunity4 = /** @type {(inputs: Launchpad_Becomeanapp_Joindevelopercommunity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoignez notre communauté de développeurs aujourd'hui`)
};

const ko_launchpad_becomeanapp_joindevelopercommunity4 = /** @type {(inputs: Launchpad_Becomeanapp_Joindevelopercommunity4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`오늘 개발자 커뮤니티에 가입하세요`)
};

/**
* | output |
* | --- |
* | "Join our developer community today" |
*
* @param {Launchpad_Becomeanapp_Joindevelopercommunity4Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_becomeanapp_joindevelopercommunity4 = /** @type {((inputs?: Launchpad_Becomeanapp_Joindevelopercommunity4Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Becomeanapp_Joindevelopercommunity4Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_becomeanapp_joindevelopercommunity4(inputs)
	if (locale === "es") return es_launchpad_becomeanapp_joindevelopercommunity4(inputs)
	if (locale === "de") return de_launchpad_becomeanapp_joindevelopercommunity4(inputs)
	if (locale === "ar") return ar_launchpad_becomeanapp_joindevelopercommunity4(inputs)
	if (locale === "fr") return fr_launchpad_becomeanapp_joindevelopercommunity4(inputs)
	return ko_launchpad_becomeanapp_joindevelopercommunity4(inputs)
});
export { launchpad_becomeanapp_joindevelopercommunity4 as "launchpad.becomeAnApp.joinDeveloperCommunity" }