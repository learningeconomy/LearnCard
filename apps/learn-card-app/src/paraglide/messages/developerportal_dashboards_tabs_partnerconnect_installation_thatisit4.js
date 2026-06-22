/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Thatisit4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_installation_thatisit4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Thatisit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`That's it! Users are already logged in when inside the wallet, so requestIdentity() returns instantly with their profile.`)
};

const es_developerportal_dashboards_tabs_partnerconnect_installation_thatisit4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Thatisit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Eso es todo! Los usuarios ya han iniciado sesión dentro de la billetera, por lo que requestIdentity() devuelve instantáneamente su perfil.`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_installation_thatisit4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Thatisit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Et voilà ! Les utilisateurs sont déjà connectés dans le portefeuille, donc requestIdentity() retourne instantanément leur profil.`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_installation_thatisit4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Thatisit4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذا كل شيء! المستخدمون مسجلون الدخول بالفعل داخل المحفظة، لذا requestIdentity() يعيد ملفهم الشخصي فورًا.`)
};

/**
* | output |
* | --- |
* | "That's it! Users are already logged in when inside the wallet, so requestIdentity() returns instantly with their profile." |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Thatisit4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_installation_thatisit4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Thatisit4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Thatisit4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_installation_thatisit4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_installation_thatisit4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_installation_thatisit4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_installation_thatisit4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_installation_thatisit4 as "developerPortal.dashboards.tabs.partnerConnect.installation.thatIsIt" }