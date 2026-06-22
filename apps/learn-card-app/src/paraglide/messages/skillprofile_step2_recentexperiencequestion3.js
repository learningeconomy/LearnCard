/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Recentexperiencequestion3Inputs */

const en_skillprofile_step2_recentexperiencequestion3 = /** @type {(inputs: Skillprofile_Step2_Recentexperiencequestion3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What is your most recent work experience?`)
};

const es_skillprofile_step2_recentexperiencequestion3 = /** @type {(inputs: Skillprofile_Step2_Recentexperiencequestion3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cuál es tu experiencia laboral más reciente?`)
};

const fr_skillprofile_step2_recentexperiencequestion3 = /** @type {(inputs: Skillprofile_Step2_Recentexperiencequestion3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quelle est votre expérience professionnelle la plus récente ?`)
};

const ar_skillprofile_step2_recentexperiencequestion3 = /** @type {(inputs: Skillprofile_Step2_Recentexperiencequestion3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما هي أحدث خبرة عمل لديك؟`)
};

/**
* | output |
* | --- |
* | "What is your most recent work experience?" |
*
* @param {Skillprofile_Step2_Recentexperiencequestion3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_recentexperiencequestion3 = /** @type {((inputs?: Skillprofile_Step2_Recentexperiencequestion3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Recentexperiencequestion3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_recentexperiencequestion3(inputs)
	if (locale === "es") return es_skillprofile_step2_recentexperiencequestion3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_recentexperiencequestion3(inputs)
	return ar_skillprofile_step2_recentexperiencequestion3(inputs)
});
export { skillprofile_step2_recentexperiencequestion3 as "skillProfile.step2.recentExperienceQuestion" }