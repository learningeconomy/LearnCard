import React from "react";

import { IonContent, IonPage } from "@ionic/react";
import MainHeader from '../../components/main-header/MainHeader';

import { CurvedBackdropEl } from 'learn-card-base';
import { SubheaderTypeEnum} from '../../components/main-subheader/MainSubHeader.types';
import { TYPE_TO_IMG_SRC, WALLET_SUBTYPES } from "@learncard/react";

const CurrenciesPage: React.FC = () => {
  const imgSrc = TYPE_TO_IMG_SRC[WALLET_SUBTYPES.CURRENCIES];
  return (
    <IonPage className="bg-cyan-700">
      <MainHeader
        showBackButton
        subheaderType={SubheaderTypeEnum.Currency}
      ></MainHeader>
      <IonContent fullscreen className="currencies-page" color={"cyan-700"}>
      <CurvedBackdropEl className="bg-cyan-300" />
        <section className="flex flex-col pt-[10px] px-[20px] text-center justify-center">
          <img src={imgSrc} alt="currencies" className="relative max-w-[250px] m-auto" />
          <strong  className="relative">No currencies yet.</strong>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default CurrenciesPage;
