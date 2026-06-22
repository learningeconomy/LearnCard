/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Step3desc4Inputs */

const en_developerportal_integrationguide_directlink_step3desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`If you need to verify the user's identity, you can resolve their DID.`)
};

const es_developerportal_integrationguide_directlink_step3desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si necesitas verificar la identidad del usuario, puedes resolver su DID.`)
};

const fr_developerportal_integrationguide_directlink_step3desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si vous devez vérifier l'identité de l'utilisateur, vous pouvez résoudre son DID.`)
};

const ar_developerportal_integrationguide_directlink_step3desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step3desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إذا كنت بحاجة إلى التحقق من هوية المستخدم، يمكنك حل DID الخاص به.`)
};

/**
* | output |
* | --- |
* | "If you need to verify the user's identity, you can resolve their DID." |
*
* @param {Developerportal_Integrationguide_Directlink_Step3desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_step3desc4 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Step3desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Step3desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_step3desc4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_step3desc4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_step3desc4(inputs)
	return ar_developerportal_integrationguide_directlink_step3desc4(inputs)
});
export { developerportal_integrationguide_directlink_step3desc4 as "developerPortal.integrationGuide.directLink.step3Desc" }