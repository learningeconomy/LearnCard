/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Usecase14Inputs */

const en_developerportal_integrationguide_directlink_usecase14 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Simple web apps that don't need wallet interaction`)
};

const es_developerportal_integrationguide_directlink_usecase14 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aplicaciones web simples que no necesitan interacción con la billetera`)
};

const fr_developerportal_integrationguide_directlink_usecase14 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Applications web simples qui n'ont pas besoin d'interaction avec le portefeuille`)
};

const ar_developerportal_integrationguide_directlink_usecase14 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقات الويب البسيطة التي لا تحتاج إلى تفاعل المحفظة`)
};

/**
* | output |
* | --- |
* | "Simple web apps that don't need wallet interaction" |
*
* @param {Developerportal_Integrationguide_Directlink_Usecase14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_usecase14 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Usecase14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Usecase14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_usecase14(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_usecase14(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_usecase14(inputs)
	return ar_developerportal_integrationguide_directlink_usecase14(inputs)
});
export { developerportal_integrationguide_directlink_usecase14 as "developerPortal.integrationGuide.directLink.useCase1" }