-- Excel Import SQL Statements
-- Generated on: 2026-01-29T22:01:40.036Z
-- Client Type Classification: ONG, Ste, ASBL = MORALE; Others = PHYSIQUE

-- Client: James Batende (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'b5037314-b059-47cb-9d99-130aa5e5e802',
  'PHYSIQUE',
  'James Batende',
  NULL,
  'James Batende',
  '+243 993 504 879',
  'dbatende@gmail.com',
  '276, Av Masisi, Q Katindo',
  'USD',
  'ACTIF'
);

-- Site: Residence James
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '79d596d9-fad5-4e8c-b28d-0f4783a64c6e',
  'b5037314-b059-47cb-9d99-130aa5e5e802',
  'Residence James',
  '276, Av Masisi, Q Katindo',
  1,
  0,
  60,
  60,
  1
);

-- Client: Souzy Musukali (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '225d2897-5683-41a3-a4e3-a22a615d5d0b',
  'PHYSIQUE',
  'Souzy Musukali',
  NULL,
  'Souzy Musukali',
  NULL,
  NULL,
  'Q Himbi',
  'USD',
  'ACTIF'
);

-- Site: Residence Souzy
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '5ec4536f-78ae-461e-b879-87dc61963440',
  '225d2897-5683-41a3-a4e3-a22a615d5d0b',
  'Residence Souzy',
  'Q Himbi',
  2,
  0,
  150,
  75,
  1
);

-- Client: Ngeve Visso Philemon (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '7579ee72-87d8-4981-9c62-26a7eaf28542',
  'PHYSIQUE',
  'Ngeve Visso Philemon',
  NULL,
  'Ngeve Visso Philemon',
  '+243 970811689',
  'philemonvisso89@gmail.com',
  '287, Av Lusaka, Q Kyeshero',
  'USD',
  'ACTIF'
);

-- Site: Emmanuel
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '821fe1c8-95c6-4bb0-a7b6-55e98f8115b4',
  '7579ee72-87d8-4981-9c62-26a7eaf28542',
  'Emmanuel',
  '287, Av Lusaka, Q Kyeshero',
  2,
  0,
  140,
  70,
  1
);

-- Client: Bio Kivu (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '98234567-b6b2-49db-84d3-77e133b8e3aa',
  'PHYSIQUE',
  'Bio Kivu',
  NULL,
  NULL,
  NULL,
  NULL,
  'Q. Bujovu',
  'USD',
  'ACTIF'
);

-- Site: Bio Kivu
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '98b8f1c2-466b-4db9-9afc-e3763da75500',
  '98234567-b6b2-49db-84d3-77e133b8e3aa',
  'Bio Kivu',
  'Q. Bujovu',
  2,
  0,
  150,
  75,
  1
);

-- Client: Ahadi Senge Phidias (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '2f0821a3-1e59-4b9b-a2e5-bff4b046240c',
  'PHYSIQUE',
  'Ahadi Senge Phidias',
  NULL,
  'Ahadi Senge Phidias',
  '+243998328295',
  NULL,
  '12, Av des Rond-point, Q. Les Volcans, Rue Lyn Lussy',
  'USD',
  'ACTIF'
);

-- Site: Residence Phidias
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '3cf905c2-11ca-4e11-8112-fb6b740cbc60',
  '2f0821a3-1e59-4b9b-a2e5-bff4b046240c',
  'Residence Phidias',
  '12, Av des Rond-point, Q. Les Volcans, Rue Lyn Lussy',
  2,
  0,
  140,
  70,
  1
);

-- Client: Virunga (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '3ff6d1b3-9f19-4acb-bc80-301e48b70c7f',
  'PHYSIQUE',
  'Virunga',
  NULL,
  NULL,
  '+243994287115',
  NULL,
  'Q. Virunga',
  'USD',
  'ACTIF'
);

-- Site: Entrepot Virunga
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '9947944b-c7f5-434d-958c-2aeb74c7a02c',
  '3ff6d1b3-9f19-4acb-bc80-301e48b70c7f',
  'Entrepot Virunga',
  'Q. Virunga',
  1,
  0,
  70,
  70,
  1
);

-- Client: Bisimwa Rodrigue (Chantier) (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '6bd54c24-2f9d-4304-a8ef-5c4a1a26c0c5',
  'PHYSIQUE',
  'Bisimwa Rodrigue (Chantier)',
  NULL,
  'Bisimwa Rodrigue',
  '0974927941',
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: Bisimwa Rodrigue (Chantier) - Site 7
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'a2826456-3a69-489e-b9a2-f84f974cdc70',
  '6bd54c24-2f9d-4304-a8ef-5c4a1a26c0c5',
  'Bisimwa Rodrigue (Chantier) - Site 7',
  NULL,
  2,
  0,
  160,
  80,
  1
);

-- Client: Bisimwa Rodrigue (Famille) (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '992c8248-b258-4ef8-8322-d2373c929f5b',
  'PHYSIQUE',
  'Bisimwa Rodrigue (Famille)',
  NULL,
  'Bisimwa Rodrigue',
  '0974927941',
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: Bisimwa Rodrigue (Famille) - Site 8
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '1ca70ab0-6f87-4d24-9207-e6c410d2cad6',
  '992c8248-b258-4ef8-8322-d2373c929f5b',
  'Bisimwa Rodrigue (Famille) - Site 8',
  NULL,
  1,
  0,
  80,
  80,
  1
);

-- Client: Makuru Amani Bienvenu (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '24fd63c4-ac64-409d-a5f9-0d4adaf454e1',
  'PHYSIQUE',
  'Makuru Amani Bienvenu',
  NULL,
  'Makuru Amani Bienvenu',
  '0998192760',
  NULL,
  '16, Av Abattoir, Q Kyeshero',
  'USD',
  'ACTIF'
);

-- Site: Makuru Amani Bienvenu - Site 9
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '23e1476e-88ae-4ee2-8860-84d431f581ba',
  '24fd63c4-ac64-409d-a5f9-0d4adaf454e1',
  'Makuru Amani Bienvenu - Site 9',
  '16, Av Abattoir, Q Kyeshero',
  1,
  0,
  80,
  80,
  1
);

-- Client: CMDIPRO (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '887c9250-1c49-4cab-87a5-35a5b9e58f0f',
  'PHYSIQUE',
  'CMDIPRO',
  NULL,
  NULL,
  NULL,
  NULL,
  'Q. Kyeshero',
  'USD',
  'ACTIF'
);

-- Site: CMDIPRO - Site 10
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'ed53521e-52c3-4b86-b726-776c05fe49e6',
  '887c9250-1c49-4cab-87a5-35a5b9e58f0f',
  'CMDIPRO - Site 10',
  'Q. Kyeshero',
  2,
  0,
  140,
  70,
  1
);

-- Client: Herman Hangi (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '3d0291c7-5fee-44f9-b87b-057aa5db0a54',
  'PHYSIQUE',
  'Herman Hangi',
  NULL,
  'Herman Hangi',
  '+243997748611',
  NULL,
  'Q. Kyeshero, Av. Lusaka',
  'USD',
  'ACTIF'
);

-- Site: Herman Hangi - Site 11
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'de4e97c0-ed85-4010-b6ba-d9a4170247a6',
  '3d0291c7-5fee-44f9-b87b-057aa5db0a54',
  'Herman Hangi - Site 11',
  'Q. Kyeshero, Av. Lusaka',
  2,
  0,
  160,
  80,
  1
);

-- Client: Okasso Djungambulu Felix (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd536dd21-3bc6-45f5-809b-412be6d642ab',
  'PHYSIQUE',
  'Okasso Djungambulu Felix',
  NULL,
  'Okasso Djungambulu Felix',
  '+243992099687',
  NULL,
  'Av. Orchide Q. Les Volcans',
  'USD',
  'ACTIF'
);

-- Site: Okasso Djungambulu Felix - Site 12
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '933f4bc7-fcd7-4e9a-bd85-f8df827662e1',
  'd536dd21-3bc6-45f5-809b-412be6d642ab',
  'Okasso Djungambulu Felix - Site 12',
  'Av. Orchide Q. Les Volcans',
  1,
  0,
  75,
  75,
  1
);

-- Client: Lucien Ntautabazi (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd24ddeb4-e4d2-448a-930f-d0de263d50b9',
  'PHYSIQUE',
  'Lucien Ntautabazi',
  NULL,
  'Lucien Ntautabazi',
  '+243993768074',
  NULL,
  'Q. Les Volcans, Rue Lyn Lusi, 061',
  'USD',
  'ACTIF'
);

-- Site: Lucien Ntautabazi - Site 13
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'a8f40e6b-98f8-42ae-8a96-eb870963025f',
  'd24ddeb4-e4d2-448a-930f-d0de263d50b9',
  'Lucien Ntautabazi - Site 13',
  'Q. Les Volcans, Rue Lyn Lusi, 061',
  1,
  0,
  70,
  70,
  1
);

-- Client: Zephirin (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '2eca1658-f893-4100-b4bc-0a5ed76d4729',
  'PHYSIQUE',
  'Zephirin',
  NULL,
  'Zephirin',
  NULL,
  NULL,
  'Q. Kyeshero Av des Eglises',
  'USD',
  'ACTIF'
);

-- Site: Zephirin - Site 14
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '057b2b7a-4e72-440c-b74f-93eb3c7ea88d',
  '2eca1658-f893-4100-b4bc-0a5ed76d4729',
  'Zephirin - Site 14',
  'Q. Kyeshero Av des Eglises',
  2,
  0,
  120,
  60,
  1
);

-- Client: Valentin Mudja (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'ae58f79e-b0df-4940-93ec-9bf0f182c015',
  'PHYSIQUE',
  'Valentin Mudja',
  NULL,
  'Mr Valentin Mudja',
  '+243997315760',
  NULL,
  'Q. Les Volcans',
  'USD',
  'ACTIF'
);

-- Site: Valentin Mudja - Site 15
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '8a52358a-24c4-47a9-9b7a-69ea058e1eef',
  'ae58f79e-b0df-4940-93ec-9bf0f182c015',
  'Valentin Mudja - Site 15',
  'Q. Les Volcans',
  1,
  0,
  50,
  50,
  1
);

-- Client: Beroya (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '1923335b-b783-4264-bdf7-d4ffe5b5fa9f',
  'PHYSIQUE',
  'Beroya',
  NULL,
  'Mulonda Myango',
  '0997787110',
  NULL,
  'Q Katindo',
  'USD',
  'ACTIF'
);

-- Site: Beroya
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '7d0c7a41-6e35-4219-b339-5202ae11ee92',
  '1923335b-b783-4264-bdf7-d4ffe5b5fa9f',
  'Beroya',
  'Q Katindo',
  1,
  0,
  75,
  75,
  1
);

-- Client: Bisimwa Rodrigue (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'a0962ef9-af28-460a-a145-b3fa90d1a364',
  'PHYSIQUE',
  'Bisimwa Rodrigue',
  NULL,
  'Bisimwa Rodrigue',
  '0974927941',
  NULL,
  'Q. Kyeshero',
  'USD',
  'ACTIF'
);

-- Site: Residence Rodrigue
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'd084bdbb-e955-45e8-a88c-ca06dd442694',
  'a0962ef9-af28-460a-a145-b3fa90d1a364',
  'Residence Rodrigue',
  'Q. Kyeshero',
  2,
  0,
  140,
  70,
  1
);

-- Client: Save Communities in Conflicts (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd43fc2c0-21c3-4c12-af80-b126fccae044',
  'PHYSIQUE',
  'Save Communities in Conflicts',
  NULL,
  NULL,
  '0994349989',
  'info@scc-drc.org',
  '100, Av de la Conference, Q Kyeshero',
  'USD',
  'ACTIF'
);

-- Site: Save Communities
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'fe997c7e-d86c-4af6-a1de-836e19ce7040',
  'd43fc2c0-21c3-4c12-af80-b126fccae044',
  'Save Communities',
  '100, Av de la Conference, Q Kyeshero',
  2,
  0,
  150,
  75,
  1
);

-- Client: UAVOU (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '3f953e1c-c94f-4731-97ab-3f12aa157ec8',
  'PHYSIQUE',
  'UAVOU',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: UAVOU - Site 19
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'a2a3ffb8-00c2-489d-8f97-a50462306d51',
  '3f953e1c-c94f-4731-97ab-3f12aa157ec8',
  'UAVOU - Site 19',
  NULL,
  1,
  0,
  50,
  50,
  1
);

-- Client: SAFI (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '9c5bbfda-3e3e-4f1b-8172-1e8dc4658af7',
  'PHYSIQUE',
  'SAFI',
  NULL,
  'SAFI',
  '0992982292',
  NULL,
  'Av. Polyclinique, Q Kyeshero',
  'USD',
  'ACTIF'
);

-- Site: SAFI - Site 20
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'ccc1c498-0b81-44ce-beca-a17ee1497434',
  '9c5bbfda-3e3e-4f1b-8172-1e8dc4658af7',
  'SAFI - Site 20',
  'Av. Polyclinique, Q Kyeshero',
  4,
  0,
  320,
  80,
  1
);

-- Client: Balola Bichonne Justin (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'a6d09183-9646-4666-8803-518519bfe4ab',
  'PHYSIQUE',
  'Balola Bichonne Justin',
  NULL,
  'Balola Bichonne Justin',
  '0997780522',
  NULL,
  'Q Virunga',
  'USD',
  'ACTIF'
);

-- Site: Balola Bichonne Justin - Site 21
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '480b6197-d61d-45da-a75f-12aebbf7b384',
  'a6d09183-9646-4666-8803-518519bfe4ab',
  'Balola Bichonne Justin - Site 21',
  'Q Virunga',
  4,
  0,
  220,
  55,
  1
);

-- Client: Willy Lombé Njaza (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '32274114-6b98-4eda-bb2a-44a4e41e791f',
  'PHYSIQUE',
  'Willy Lombé Njaza',
  NULL,
  'Willy Lombé Njaza',
  '0992232424',
  NULL,
  'Q Kyeshero',
  'USD',
  'ACTIF'
);

-- Site: Usine Rodrigue
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '8b29c076-0dd5-4760-93be-658faebd1fed',
  '32274114-6b98-4eda-bb2a-44a4e41e791f',
  'Usine Rodrigue',
  'Q Kyeshero',
  1,
  0,
  60,
  60,
  1
);

-- Client: Kabinda Fikiri Lea restaurant (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'e1f649bb-d2b4-4ed7-8e69-68cbdf663c20',
  'PHYSIQUE',
  'Kabinda Fikiri Lea restaurant',
  NULL,
  'Kabinda Fikiri Lea',
  '0999013130',
  'ntcimage1@gmail.com',
  '267, Av. Du Lac, Q Katindo',
  'USD',
  'ACTIF'
);

-- Site: Kabinda Fikiri Lea restaurant - Site 23
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '264dfe8b-b5d0-4748-9f1b-fe71261588f4',
  'e1f649bb-d2b4-4ed7-8e69-68cbdf663c20',
  'Kabinda Fikiri Lea restaurant - Site 23',
  '267, Av. Du Lac, Q Katindo',
  1,
  0,
  80,
  80,
  1
);

-- Site: Kabinda fikiri Lea Restaurant - Site 67
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '2cf25d46-7275-4e18-8ce1-5bdfc4d6129b',
  'e1f649bb-d2b4-4ed7-8e69-68cbdf663c20',
  'Kabinda fikiri Lea Restaurant - Site 67',
  '267,Av Duu Lac,Q.Katindo',
  1,
  0,
  80,
  80,
  1
);

-- Client: Bosconia (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'fc5eef0d-9caf-4729-8f6c-f3c792065eaf',
  'PHYSIQUE',
  'Bosconia',
  NULL,
  'Pere JP Tafunga',
  '0994625774',
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: Bosconia - Site 24
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '26a4ffdb-54e1-41ac-9209-1d56bff5fbc6',
  'fc5eef0d-9caf-4729-8f6c-f3c792065eaf',
  'Bosconia - Site 24',
  NULL,
  2,
  0,
  160,
  80,
  1
);

-- Client: Belle Vie Logistique (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'c31ff408-7e26-441e-b7c6-c985bdf03ded',
  'PHYSIQUE',
  'Belle Vie Logistique',
  NULL,
  'Sengi Buyibuyi',
  '0999 253 825',
  'admin@bellevielogistique.com',
  'Av. Bishweka, Q Les Volcans',
  'USD',
  'ACTIF'
);

-- Site: Garage Belle Vie
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '2e3ca316-e1e7-4834-832c-2c60396bc43d',
  'c31ff408-7e26-441e-b7c6-c985bdf03ded',
  'Garage Belle Vie',
  'Av. Bishweka, Q Les Volcans',
  1,
  0,
  120,
  120,
  1
);

-- Client: Yves Bwema (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'eb003cc1-3006-4f97-9b9e-1119e5b2c1ee',
  'PHYSIQUE',
  'Yves Bwema',
  NULL,
  'Yves Bwema',
  '097179941',
  NULL,
  'Q. Kyeshero',
  'USD',
  'ACTIF'
);

-- Site: Yves Bwema - Site 26
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '75e855a5-7316-478a-8fe7-d03e00a3fe3f',
  'eb003cc1-3006-4f97-9b9e-1119e5b2c1ee',
  'Yves Bwema - Site 26',
  'Q. Kyeshero',
  2,
  0,
  150,
  75,
  1
);

-- Client: Zero Panne (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4c4818b9-b5c2-49d8-9fbf-d2232b8b4774',
  'PHYSIQUE',
  'Zero Panne',
  NULL,
  'ZP',
  NULL,
  NULL,
  'Q. Mabanga Nord',
  'USD',
  'ACTIF'
);

-- Site: Zero Panne - Site 27
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'd12cf4f9-075f-4e16-968b-bc326866dd9d',
  '4c4818b9-b5c2-49d8-9fbf-d2232b8b4774',
  'Zero Panne - Site 27',
  'Q. Mabanga Nord',
  1,
  0,
  70,
  70,
  1
);

-- Site: Zero Panne - Site 58
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '13fb7e88-6129-4ad0-92e2-a374ea17b4ad',
  '4c4818b9-b5c2-49d8-9fbf-d2232b8b4774',
  'Zero Panne - Site 58',
  'Q.Mabanga Nord',
  1,
  0,
  70,
  70,
  1
);

-- Client: Fatuma Bukoko Gabrielle (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4b927b19-f4f3-4474-bf68-2e46ac27de09',
  'PHYSIQUE',
  'Fatuma Bukoko Gabrielle',
  NULL,
  'Gabrielle',
  '+243 972892796',
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: boutique Fatuma
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'f08cde59-d33b-4df4-8ee6-516bbb40a362',
  '4b927b19-f4f3-4474-bf68-2e46ac27de09',
  'boutique Fatuma',
  NULL,
  1,
  0,
  80,
  80,
  1
);

-- Client: Zaina Lunda (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '0e602fe3-c3e2-4be3-99a3-da0f7628a140',
  'PHYSIQUE',
  'Zaina Lunda',
  NULL,
  'Zaina Lunda',
  '+243 990723719',
  NULL,
  'Commune de Karisimbi Q. Mabanga',
  'USD',
  'ACTIF'
);

-- Site: Zaina Lunda - Site 29
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'f8304373-dd1d-439f-aff1-96e193bfbfb4',
  '0e602fe3-c3e2-4be3-99a3-da0f7628a140',
  'Zaina Lunda - Site 29',
  'Commune de Karisimbi Q. Mabanga',
  2,
  0,
  150,
  75,
  1
);

-- Client: Rachel Safari (RVA) (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4ad12586-ad80-4b72-a228-d2d491dea8d9',
  'PHYSIQUE',
  'Rachel Safari (RVA)',
  NULL,
  'Bisimwa Rodrigue',
  '0974927941',
  NULL,
  'Q. Himbi',
  'USD',
  'ACTIF'
);

-- Site: Chantier RVA
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '36875261-310d-4296-b579-489df1c31c73',
  '4ad12586-ad80-4b72-a228-d2d491dea8d9',
  'Chantier RVA',
  'Q. Himbi',
  2,
  0,
  150,
  75,
  1
);

-- Client: Bishworld Auto (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'eb0d653f-c219-4232-8519-824166deefdc',
  'PHYSIQUE',
  'Bishworld Auto',
  NULL,
  'Bienfait Lunda',
  '+243818989280',
  'sales@bishworld-rdc.com',
  '05, Av Walikale, Q. Les Volcans',
  'USD',
  'ACTIF'
);

-- Site: Bishworld
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'a616b69a-aee9-4963-9412-b8e9e3f5d264',
  'eb0d653f-c219-4232-8519-824166deefdc',
  'Bishworld',
  '05, Av Walikale, Q. Les Volcans',
  2,
  0,
  150,
  75,
  1
);

-- Client: Kangamutima Zabika Christophe (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '7f98e25a-5602-40c1-94f1-46b71bb777a3',
  'PHYSIQUE',
  'Kangamutima Zabika Christophe',
  NULL,
  'Kangamutima Zabika Christophe',
  '0974232400',
  NULL,
  '35A, Av. De la mission, Q. Himbi',
  'USD',
  'ACTIF'
);

-- Site: Res Christophe
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '42de553f-520c-48c3-a293-9677cd980d2e',
  '7f98e25a-5602-40c1-94f1-46b71bb777a3',
  'Res Christophe',
  '35A, Av. De la mission, Q. Himbi',
  1,
  0,
  75,
  75,
  1
);

-- Client: Baseme Rwicha Victoire BASEME RWICHA Victoire (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'ce67fb48-7340-4f23-8088-27022cecf9ab',
  'PHYSIQUE',
  'Baseme Rwicha Victoire BASEME RWICHA Victoire',
  NULL,
  'Baseme Rwicha Victoire BASEME RWICHA Victoire',
  '0973615760',
  NULL,
  'Q. Kyeshero',
  'USD',
  'ACTIF'
);

-- Site: Res. Victoire
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '24f6afd4-19bf-4bef-a6b7-f9d9369c81bd',
  'ce67fb48-7340-4f23-8088-27022cecf9ab',
  'Res. Victoire',
  'Q. Kyeshero',
  2,
  0,
  150,
  75,
  1
);

-- Client: Congo Handicap (MORALE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'bd39fd07-e62c-421d-bab4-5f1edd0b1314',
  'MORALE',
  'Congo Handicap',
  NULL,
  NULL,
  NULL,
  NULL,
  'Q. Mabanga Sud',
  'USD',
  'ACTIF'
);

-- Site: Congo Handicap - Site 34
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '6a0cea75-2c2f-45f5-ac44-f0d8d51245d0',
  'bd39fd07-e62c-421d-bab4-5f1edd0b1314',
  'Congo Handicap - Site 34',
  'Q. Mabanga Sud',
  2,
  0,
  150,
  75,
  1
);

-- Client: Rachell Safari (TMK) (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'de3bd2b7-b085-4ba1-8e37-4eb42b6a2c08',
  'PHYSIQUE',
  'Rachell Safari (TMK)',
  NULL,
  'Rachel Safari',
  NULL,
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: Rachell Safari (TMK) - Site 35
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'f438b401-251c-407c-a7fe-b42ad22388fd',
  'de3bd2b7-b085-4ba1-8e37-4eb42b6a2c08',
  'Rachell Safari (TMK) - Site 35',
  NULL,
  1,
  0,
  75,
  75,
  1
);

-- Client: KABU MBOMBO Blandine (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4021f341-0614-484f-a3ca-beb52f4ca827',
  'PHYSIQUE',
  'KABU MBOMBO Blandine',
  NULL,
  'BLANDINE',
  '0993328032',
  NULL,
  'Q. le volcan AV. Boungain ville N.23',
  'USD',
  'ACTIF'
);

-- Site: Papeterie
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '5d751a53-d60c-43e0-ab37-965451ec5084',
  '4021f341-0614-484f-a3ca-beb52f4ca827',
  'Papeterie',
  'Q. le volcan AV. Boungain ville N.23',
  1,
  0,
  70,
  70,
  1
);

-- Client: MWATI MAMBO (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'a31616fd-83ba-44c2-af5e-eda839e4ef73',
  'PHYSIQUE',
  'MWATI MAMBO',
  NULL,
  'MWATI',
  NULL,
  NULL,
  'Q. Kyeshero Q.keshero',
  'USD',
  'ACTIF'
);

-- Site: Chantier mwati
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '9679b5ef-ccbf-460a-afe2-8c9cbb08807d',
  'a31616fd-83ba-44c2-af5e-eda839e4ef73',
  'Chantier mwati',
  'Q. Kyeshero Q.keshero',
  2,
  0,
  200,
  100,
  1
);

-- Client: BALUARTE (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'b9cd3e65-c844-45c5-a149-590438bc7253',
  'PHYSIQUE',
  'BALUARTE',
  NULL,
  'CLAUDIA SHALUKOMA',
  '0977181304',
  'claudiashalu@gmail.com',
  'Q.Keshero AV. Kituku N.53',
  'USD',
  'ACTIF'
);

-- Site: Orphelinat
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '6fc8f36e-c33d-4c83-8f21-6f61139ba501',
  'b9cd3e65-c844-45c5-a149-590438bc7253',
  'Orphelinat',
  'Q.Keshero AV. Kituku N.53',
  2,
  0,
  160,
  80,
  1
);

-- Client: BIENFAIT LUNDA (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '928e9f66-b379-453a-9ce2-a82655f49ec4',
  'PHYSIQUE',
  'BIENFAIT LUNDA',
  NULL,
  'LUNDA',
  NULL,
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: Petit pari
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '0fc32349-e56c-4c75-a294-2d00e467a9a6',
  '928e9f66-b379-453a-9ce2-a82655f49ec4',
  'Petit pari',
  NULL,
  2,
  0,
  150,
  75,
  1
);

-- Client: EDOUARD MUSHAGALUSA (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4a682cd8-817b-43e4-85c2-54ec2fad4632',
  'PHYSIQUE',
  'EDOUARD MUSHAGALUSA',
  NULL,
  'Mr Edouard',
  '0997604097',
  NULL,
  'Q. Kyeshoro Av. Magene',
  'USD',
  'ACTIF'
);

-- Site: Res. Edouard
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'e8b828d4-3dad-4c5d-a62f-105e7229f85c',
  '4a682cd8-817b-43e4-85c2-54ec2fad4632',
  'Res. Edouard',
  'Q. Kyeshoro Av. Magene',
  1,
  0,
  70,
  70,
  1
);

-- Client: MPARANYI MURHULA BAUDOUIN (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'b2abbcb3-d567-4f69-9da4-3920fc5c6151',
  'PHYSIQUE',
  'MPARANYI MURHULA BAUDOUIN',
  NULL,
  'BAUDOUIN',
  '0997724648',
  NULL,
  'GOMA Q.Kyeshero, kituku',
  'USD',
  'ACTIF'
);

-- Site: MPARANYI MURHULA BAUDOUIN - Site 41
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'acc47e4e-dd4b-4bc6-88be-88128fb06bc7',
  'b2abbcb3-d567-4f69-9da4-3920fc5c6151',
  'MPARANYI MURHULA BAUDOUIN - Site 41',
  'GOMA Q.Kyeshero, kituku',
  1,
  0,
  70,
  70,
  1
);

-- Client: GUILLAIN (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'b077b1dd-75c3-4312-826b-e1582b5aef11',
  'PHYSIQUE',
  'GUILLAIN',
  NULL,
  'GUILLAIN',
  NULL,
  NULL,
  'Q. le volcan',
  'USD',
  'ACTIF'
);

-- Site: GUILLAIN - Site 42
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'b55d0422-6317-499f-b355-e86d3cb16eee',
  'b077b1dd-75c3-4312-826b-e1582b5aef11',
  'GUILLAIN - Site 42',
  'Q. le volcan',
  2,
  0,
  140,
  70,
  1
);

-- Client: CLAUDIA (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '8aa7f484-e071-47c9-938e-7b814c62434b',
  'PHYSIQUE',
  'CLAUDIA',
  NULL,
  'CLAUDIA',
  '0971324625',
  NULL,
  'Q. Keshero',
  'USD',
  'ACTIF'
);

-- Site: CLAUDIA - Site 43
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '45a6d18c-df7a-4749-b225-eda0e9bdf786',
  '8aa7f484-e071-47c9-938e-7b814c62434b',
  'CLAUDIA - Site 43',
  'Q. Keshero',
  1,
  0,
  70,
  70,
  1
);

-- Client: COEUR SANS FRONTIERES (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '19057807-e45c-4fdf-ac18-951abafb145a',
  'PHYSIQUE',
  'COEUR SANS FRONTIERES',
  NULL,
  'Mr Adolphhe Babu Bonendebe',
  NULL,
  'csf_rdc@yahoo.fr',
  'Q. Himbi Av. Du lac',
  'USD',
  'ACTIF'
);

-- Site: COEUR SANS FRONTIERES - Site 44
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'bc996369-d26c-42cf-8b3f-b3d52b25491e',
  '19057807-e45c-4fdf-ac18-951abafb145a',
  'COEUR SANS FRONTIERES - Site 44',
  'Q. Himbi Av. Du lac',
  2,
  0,
  300,
  150,
  1
);

-- Client: Mumuza Muhindo Musubao(Sarah) (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '35fd74d7-9614-4d43-873a-efaef330fa1c',
  'PHYSIQUE',
  'Mumuza Muhindo Musubao(Sarah)',
  NULL,
  'Sarah',
  NULL,
  NULL,
  'Q. Himbi',
  'USD',
  'ACTIF'
);

-- Site: Mumuza Muhindo Musubao(Sarah) - Site 45
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'ecbc5050-317b-4ea5-a8b3-a1d8afd167f2',
  '35fd74d7-9614-4d43-873a-efaef330fa1c',
  'Mumuza Muhindo Musubao(Sarah) - Site 45',
  'Q. Himbi',
  2,
  0,
  160,
  80,
  1
);

-- Client: Yannick Musoso (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'c79cd12b-01a9-4825-84ec-6bf681b3166e',
  'PHYSIQUE',
  'Yannick Musoso',
  NULL,
  'Yannick',
  '0997283685',
  'bishack399@gmail.com',
  'Maganga N 108',
  'USD',
  'ACTIF'
);

-- Site: Yannick Musoso - Site 46
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '8b4cb91f-63c8-477c-90c9-fbe901407327',
  'c79cd12b-01a9-4825-84ec-6bf681b3166e',
  'Yannick Musoso - Site 46',
  'Maganga N 108',
  1,
  0,
  80,
  80,
  1
);

-- Client: Herman Hangi (poulailller) (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '63da05b2-db8b-45a9-9030-7034e9e42649',
  'PHYSIQUE',
  'Herman Hangi (poulailller)',
  NULL,
  'Herman',
  '0997748611',
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: Herman Hangi (poulailller) - Site 47
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '69b13725-4bef-4fdc-bbf3-00489df1f097',
  '63da05b2-db8b-45a9-9030-7034e9e42649',
  'Herman Hangi (poulailller) - Site 47',
  NULL,
  1,
  0,
  80,
  80,
  1
);

-- Client: ITEGWA NCHIKO DESIRE (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '246752bb-32e0-41ee-9759-5f8cdf21eb14',
  'PHYSIQUE',
  'ITEGWA NCHIKO DESIRE',
  NULL,
  'ITEGWA NCHIKO DESIRE',
  '0975926269, 0821780761',
  NULL,
  'Kyeshoro AV. Topographe N.5',
  'USD',
  'ACTIF'
);

-- Site: ITEGWA NCHIKO DESIRE - Site 48
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '97940a79-1959-4f78-bc7a-9e2bcc464ff3',
  '246752bb-32e0-41ee-9759-5f8cdf21eb14',
  'ITEGWA NCHIKO DESIRE - Site 48',
  'Kyeshoro AV. Topographe N.5',
  2,
  0,
  100,
  50,
  1
);

-- Client: Bulimwengu Walanga Albert (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '871890ba-2194-48da-9a83-b62a78be4323',
  'PHYSIQUE',
  'Bulimwengu Walanga Albert',
  NULL,
  'Mr ALBERT',
  '0820335110, 0997673808',
  NULL,
  'Keshero Av. Kizito',
  'USD',
  'ACTIF'
);

-- Site: Bulimwengu Walanga Albert - Site 49
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '84b495c7-3fe5-4ae1-8cec-e8c9fbc69dd6',
  '871890ba-2194-48da-9a83-b62a78be4323',
  'Bulimwengu Walanga Albert - Site 49',
  'Keshero Av. Kizito',
  1,
  0,
  80,
  80,
  1
);

-- Client: Albert BULIMWENGU (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'a27bc0ce-8bd9-43d7-a2d5-1280593c7de6',
  'PHYSIQUE',
  'Albert BULIMWENGU',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: Albert BULIMWENGU - Site 50
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '84480acc-19b8-4c18-958e-d915a6d70de9',
  'a27bc0ce-8bd9-43d7-a2d5-1280593c7de6',
  'Albert BULIMWENGU - Site 50',
  NULL,
  1,
  0,
  60,
  60,
  1
);

-- Client: Freedom Plazza Restaurant Freedom Plazza Restaurant (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'a68f2523-ba18-4c3c-812d-4628470c5bf2',
  'PHYSIQUE',
  'Freedom Plazza Restaurant Freedom Plazza Restaurant',
  NULL,
  'SIMINI BAHATI DANIEL',
  '0991369565',
  NULL,
  'imbi, Av Felix, c. Goma',
  'USD',
  'ACTIF'
);

-- Site: Himbi, av. Felix,c.goma
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '862c702e-46f8-4583-88ba-d093c2355e4b',
  'a68f2523-ba18-4c3c-812d-4628470c5bf2',
  'Himbi, av. Felix,c.goma',
  'imbi, Av Felix, c. Goma',
  1,
  0,
  70,
  70,
  1
);

-- Client: LEA KABINDA RESIDENCE (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '2fb8ec15-3f76-4a58-90f1-81651e2460b4',
  'PHYSIQUE',
  'LEA KABINDA RESIDENCE',
  NULL,
  'LEA KABINDA RESIDENCE',
  '0990804730',
  NULL,
  'Q.HIMBI',
  'USD',
  'ACTIF'
);

-- Site: RESIDENCE LEA KABINDA
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '8966cddc-8e93-4ff2-a779-c5f04f229dd0',
  '2fb8ec15-3f76-4a58-90f1-81651e2460b4',
  'RESIDENCE LEA KABINDA',
  'Q.HIMBI',
  1,
  0,
  80,
  80,
  1
);

-- Client: PAPY ABEDI USSENI (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd4c583a0-7a33-42f3-9a6f-7a5da5eefc48',
  'PHYSIQUE',
  'PAPY ABEDI USSENI',
  NULL,
  'PAPY ABEDI USSENI',
  '0974685763',
  NULL,
  'Av. CARMEL, N 06,Q.KATINDO,C/GOMA',
  'USD',
  'ACTIF'
);

-- Site: PAPY ABEDI USSENI - Site 53
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'a9907f56-e75c-4d63-b161-7f1b4d2d4b33',
  'd4c583a0-7a33-42f3-9a6f-7a5da5eefc48',
  'PAPY ABEDI USSENI - Site 53',
  'Av. CARMEL, N 06,Q.KATINDO,C/GOMA',
  2,
  0,
  160,
  80,
  1
);

-- Client: Freedom Plazza Batiment (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '26de9b86-128b-4080-ad94-876fac758a40',
  'PHYSIQUE',
  'Freedom Plazza Batiment',
  NULL,
  'SIMINI BAHATI DANIEL',
  '0998831573',
  NULL,
  'HIMBI,AV FELIX,C.GOMA',
  'USD',
  'ACTIF'
);

-- Site: Freedom Plazza Batiment - Site 54
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'b549215a-40a5-4740-a595-98528247e19c',
  '26de9b86-128b-4080-ad94-876fac758a40',
  'Freedom Plazza Batiment - Site 54',
  'HIMBI,AV FELIX,C.GOMA',
  1,
  0,
  70,
  70,
  1
);

-- Client: NGUBA JOSEPH (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '02aeccd3-34cb-4e99-8290-4de5dfb6cfae',
  'PHYSIQUE',
  'NGUBA JOSEPH',
  NULL,
  'NGUBA JOSEPH',
  '0976621130',
  NULL,
  'Q.HIMBI,AV MAGANGA',
  'USD',
  'ACTIF'
);

-- Site: NGUBA JOSEPH - Site 55
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'b77bb4ae-5f54-423f-b450-d270fba60091',
  '02aeccd3-34cb-4e99-8290-4de5dfb6cfae',
  'NGUBA JOSEPH - Site 55',
  'Q.HIMBI,AV MAGANGA',
  1,
  0,
  80,
  80,
  1
);

-- Client: CENTRE HOSPITALIER. HESHIMA (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'fe95c21f-85c4-4569-ab82-96e1b03aad15',
  'PHYSIQUE',
  'CENTRE HOSPITALIER. HESHIMA',
  NULL,
  'Dr BOSE',
  '0993312853',
  NULL,
  'Q,KKYYESHERO,AV KARIBU',
  'USD',
  'ACTIF'
);

-- Site: CENTRE HOSPITALIER. HESHIMA - Site 56
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '455e097d-69e1-44fd-9207-baed50ecdc1a',
  'fe95c21f-85c4-4569-ab82-96e1b03aad15',
  'CENTRE HOSPITALIER. HESHIMA - Site 56',
  'Q,KKYYESHERO,AV KARIBU',
  2,
  0,
  200,
  100,
  1
);

-- Client: ANUNGA THERESE HABITATION (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '0a9bb9d4-3c67-4891-ad03-415f05cfc6d9',
  'PHYSIQUE',
  'ANUNGA THERESE HABITATION',
  NULL,
  'ANUNGA THERESE HHABITATION',
  '0997757433',
  NULL,
  'KESHERO',
  'USD',
  'ACTIF'
);

-- Site: ANUNGA THERESE HABITATION - Site 57
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '5cb03ebb-914c-42bf-a7d6-95ac48635557',
  '0a9bb9d4-3c67-4891-ad03-415f05cfc6d9',
  'ANUNGA THERESE HABITATION - Site 57',
  'KESHERO',
  1,
  0,
  70,
  70,
  1
);

-- Client: Residence Joelle MWAMINI (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '2042300e-766c-4260-8cc9-9157d2e9c33f',
  'PHYSIQUE',
  'Residence Joelle MWAMINI',
  NULL,
  'JOELLE MWAMINI',
  '0994261859',
  NULL,
  'Q.KESHHERO, Av Abbatoir',
  'USD',
  'ACTIF'
);

-- Site: Residence Joelle MWAMINI - Site 59
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '2ca54846-c3e1-4b1f-8a79-512e8f606f0c',
  '2042300e-766c-4260-8cc9-9157d2e9c33f',
  'Residence Joelle MWAMINI - Site 59',
  'Q.KESHHERO, Av Abbatoir',
  1,
  0,
  70,
  70,
  1
);

-- Client: Pacifique (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '10d3a526-c71b-470d-8b91-30395a454251',
  'PHYSIQUE',
  'Pacifique',
  NULL,
  'Pacifique',
  '0993333274',
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: Pacifique - Site 60
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'a6ee993a-176a-4243-a2ae-717c72d096d1',
  '10d3a526-c71b-470d-8b91-30395a454251',
  'Pacifique - Site 60',
  NULL,
  1,
  0,
  70,
  70,
  1
);

-- Client: MAKURU BIENVENU (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '9bd5b98f-1d0c-4b24-adb8-ba57c28a21c5',
  'PHYSIQUE',
  'MAKURU BIENVENU',
  NULL,
  'MAKURU BIENVENU',
  NULL,
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: MAKURU BIENVENU - Site 61
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'aa951380-375f-4b85-a328-ad93c1f6b20b',
  '9bd5b98f-1d0c-4b24-adb8-ba57c28a21c5',
  'MAKURU BIENVENU - Site 61',
  NULL,
  1,
  0,
  80,
  80,
  1
);

-- Client: Coeur Sans Frontieres/ KIWANJA (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4d3376e5-8d9f-494d-9e3c-4eab903f6d14',
  'PHYSIQUE',
  'Coeur Sans Frontieres/ KIWANJA',
  NULL,
  'Coeur Sans Frontieres KIWANJA',
  '0',
  NULL,
  'Kiwanja',
  'USD',
  'ACTIF'
);

-- Site: Coeur Sans Frontieres/ KIWANJA - Site 62
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '271ccd6f-a58d-49b6-b306-2bdf8caa210c',
  '4d3376e5-8d9f-494d-9e3c-4eab903f6d14',
  'Coeur Sans Frontieres/ KIWANJA - Site 62',
  'Kiwanja',
  2,
  0,
  150,
  75,
  1
);

-- Client: Coeur Sans Frontieres KIWANJA (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4eb1080d-62ce-47bf-b21f-c3a66915fb0e',
  'PHYSIQUE',
  'Coeur Sans Frontieres KIWANJA',
  NULL,
  'Coeur Sans Fro',
  '0994261859',
  NULL,
  'kiwanja',
  'USD',
  'ACTIF'
);

-- Site: Coeur Sans Frontieres KIWANJA - Site 63
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '3273e2aa-b8e5-4fce-a570-950c755174a2',
  '4eb1080d-62ce-47bf-b21f-c3a66915fb0e',
  'Coeur Sans Frontieres KIWANJA - Site 63',
  'kiwanja',
  2,
  0,
  300,
  150,
  1
);

-- Client: Coeur-Sans- Frontiere (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '7f6cdeaf-8779-4c69-a6e1-4ec6ec253072',
  'PHYSIQUE',
  'Coeur-Sans- Frontiere',
  NULL,
  'Coeur- Sans -Frontiere',
  NULL,
  NULL,
  'Q.HIMBI',
  'USD',
  'ACTIF'
);

-- Site: Coeur-Sans- Frontiere - Site 64
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'f1565186-a946-4b6e-af46-f46701c50955',
  '7f6cdeaf-8779-4c69-a6e1-4ec6ec253072',
  'Coeur-Sans- Frontiere - Site 64',
  'Q.HIMBI',
  2,
  0,
  150,
  75,
  1
);

-- Client: Congo- Handicap (MORALE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '16751b21-f544-4891-9b04-90d569c5b307',
  'MORALE',
  'Congo- Handicap',
  NULL,
  'M''Monga Kitulo',
  '0995696150',
  'congohandicap@gmail.com',
  NULL,
  'USD',
  'ACTIF'
);

-- Site: Congo- Handicap - Site 65
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'b147ae79-cbed-447b-800b-a3233ac11f68',
  '16751b21-f544-4891-9b04-90d569c5b307',
  'Congo- Handicap - Site 65',
  NULL,
  2,
  0,
  200,
  100,
  1
);

-- Client: MATABISHI MARCELLIN (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '58c9d507-1254-4cba-b517-612db93fa9bd',
  'PHYSIQUE',
  'MATABISHI MARCELLIN',
  NULL,
  'MATABISHI MARCELLIN',
  NULL,
  NULL,
  'Q.LES VOLCANS',
  'USD',
  'ACTIF'
);

-- Site: MATABISHI MARCELLIN - Site 66
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'b50d82e6-75d2-4ae1-b2d1-ab489efe1f5a',
  '58c9d507-1254-4cba-b517-612db93fa9bd',
  'MATABISHI MARCELLIN - Site 66',
  'Q.LES VOLCANS',
  1,
  0,
  60,
  60,
  1
);

-- Client: JOELLE MWAMINI (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '81b60f1b-cee1-4e81-bdcb-c2554a0fd262',
  'PHYSIQUE',
  'JOELLE MWAMINI',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'USD',
  'ACTIF'
);

-- Site: JOELLE MWAMINI - Site 68
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '0f3ba061-1f58-4c39-939b-ee37e632a5e8',
  '81b60f1b-cee1-4e81-bdcb-c2554a0fd262',
  'JOELLE MWAMINI - Site 68',
  NULL,
  1,
  0,
  70,
  70,
  1
);

-- Client: QUICK COLOR SOLUTION (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'caa80371-d279-4d41-bd06-8a00e05c229c',
  'PHYSIQUE',
  'QUICK COLOR SOLUTION',
  NULL,
  'Mr Yannick THUMBA',
  '0976628297',
  NULL,
  'Q.Kyeshero, Av. Abattoir',
  'USD',
  'ACTIF'
);

-- Site: QUICK COLOR SOLUTION - Site 69
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '5c10999d-e5d3-413f-9307-f51162452091',
  'caa80371-d279-4d41-bd06-8a00e05c229c',
  'QUICK COLOR SOLUTION - Site 69',
  'Q.Kyeshero, Av. Abattoir',
  1,
  0,
  100,
  100,
  1
);

-- Client: KIBANCHA FABRICE (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'ac72d1d6-2abb-4ac3-8a59-acbd361a5991',
  'PHYSIQUE',
  'KIBANCHA FABRICE',
  NULL,
  'KIBANCHA FABRICE',
  '0999851246',
  NULL,
  'Q.HIMBI,AV.DU LAC,N 319',
  'USD',
  'ACTIF'
);

-- Site: KIBANCHA FABRICE - Site 70
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '555049ed-4480-46d1-9618-99eda75c6b91',
  'ac72d1d6-2abb-4ac3-8a59-acbd361a5991',
  'KIBANCHA FABRICE - Site 70',
  'Q.HIMBI,AV.DU LAC,N 319',
  1,
  0,
  70,
  70,
  1
);

-- Client: FAIDA JUSTINE (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '48412c79-238c-429a-9362-244976b48f00',
  'PHYSIQUE',
  'FAIDA JUSTINE',
  NULL,
  'FAIDA JUSTINE',
  '0842377799',
  NULL,
  'Q.HIMBI,AV UVIRA',
  'USD',
  'ACTIF'
);

-- Site: FAIDA JUSTINE - Site 71
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '909fcdea-9652-44d5-a18e-f2de6bfe2f29',
  '48412c79-238c-429a-9362-244976b48f00',
  'FAIDA JUSTINE - Site 71',
  'Q.HIMBI,AV UVIRA',
  1,
  0,
  80,
  80,
  1
);

-- Site: FAIDA JUSTINE - Site 76
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'c4afb49e-2796-4555-9a12-13bf0661170a',
  '48412c79-238c-429a-9362-244976b48f00',
  'FAIDA JUSTINE - Site 76',
  'Q.HIMBI,AV UVIRA',
  1,
  0,
  80,
  80,
  1
);

-- Client: UFEDOC (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'f91e0bff-4474-4dbd-b87d-fb27fe7ccc65',
  'PHYSIQUE',
  'UFEDOC',
  NULL,
  'Mme ANUNGA TERESE',
  '0978070653',
  NULL,
  'Q.HIMBI',
  'USD',
  'ACTIF'
);

-- Site: UFEDOC - Site 72
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'a66184f3-c260-4afd-b2ff-6e46c99ad873',
  'f91e0bff-4474-4dbd-b87d-fb27fe7ccc65',
  'UFEDOC - Site 72',
  'Q.HIMBI',
  1,
  0,
  75,
  75,
  1
);

-- Client: Mr Bazuzi Nickel (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '283c8b28-cc8e-405f-9b8c-fd1fae9a9568',
  'PHYSIQUE',
  'Mr Bazuzi Nickel',
  NULL,
  'Mr Bazuzi Nickel',
  '0816874014',
  NULL,
  'Q.KYESHERO,Faculte de Droit',
  'USD',
  'ACTIF'
);

-- Site: Mr Bazuzi Nickel - Site 73
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'cc2da1d5-b67c-4e15-9a26-1dd2a6eadd2e',
  '283c8b28-cc8e-405f-9b8c-fd1fae9a9568',
  'Mr Bazuzi Nickel - Site 73',
  'Q.KYESHERO,Faculte de Droit',
  1,
  0,
  70,
  70,
  1
);

-- Client: Impala Bar (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '26c71952-caed-4077-a59c-2e44ff000c59',
  'PHYSIQUE',
  'Impala Bar',
  NULL,
  'Bazuzi Nickel',
  '0816874014',
  NULL,
  'Q.KATOYI',
  'USD',
  'ACTIF'
);

-- Site: Impala Bar - Site 74
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'cfcef0df-c7e8-4c4e-a46d-6a49b13746d8',
  '26c71952-caed-4077-a59c-2e44ff000c59',
  'Impala Bar - Site 74',
  'Q.KATOYI',
  1,
  0,
  70,
  70,
  1
);

-- Client: ALBERT (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '39a830da-f205-4d4c-9f20-84065d6929e3',
  'PHYSIQUE',
  'ALBERT',
  NULL,
  'Mr ALBERT',
  '0997673808',
  NULL,
  'Q.KYESHERO',
  'USD',
  'ACTIF'
);

-- Site: ALBERT - Site 75
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'd45c16ec-e8e4-4eff-b49f-fdd93da50ec9',
  '39a830da-f205-4d4c-9f20-84065d6929e3',
  'ALBERT - Site 75',
  'Q.KYESHERO',
  1,
  0,
  80,
  80,
  1
);

-- Client: Save Communities in Conflits (SCC) (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '283ad8b1-dbc6-4ed4-a76c-537e9849821e',
  'PHYSIQUE',
  'Save Communities in Conflits (SCC)',
  NULL,
  NULL,
  '0994349989',
  NULL,
  'Q.HIMBI',
  'USD',
  'ACTIF'
);

-- Site: Save Communities in Conflits (SCC) - Site 77
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '274c2ab7-5ec0-4f1b-8d1c-4216465cb0ae',
  '283ad8b1-dbc6-4ed4-a76c-537e9849821e',
  'Save Communities in Conflits (SCC) - Site 77',
  'Q.HIMBI',
  2,
  0,
  150,
  75,
  1
);

-- Client: COEUR SANS FRONTIERES SAKE (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd0391a51-3c5a-41c0-8029-cf0a6c6e5274',
  'PHYSIQUE',
  'COEUR SANS FRONTIERES SAKE',
  NULL,
  'Mr ADOLPHE BABU BONENDEBE',
  NULL,
  NULL,
  'SAKE',
  'USD',
  'ACTIF'
);

-- Site: COEUR SANS FRONTIERES SAKE - Site 78
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'c3d4e49c-2b43-45ec-9a28-a029cdc8d869',
  'd0391a51-3c5a-41c0-8029-cf0a6c6e5274',
  'COEUR SANS FRONTIERES SAKE - Site 78',
  'SAKE',
  1,
  0,
  100,
  100,
  1
);

-- Client: COEUR SANS FRONTIERES KIHINDO (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '2df32d8a-96f9-4c0c-a6d1-4481c084c212',
  'PHYSIQUE',
  'COEUR SANS FRONTIERES KIHINDO',
  NULL,
  'Mr ADOLPHE BABU BONENDEBE',
  NULL,
  NULL,
  'KIHINDO',
  'USD',
  'ACTIF'
);

-- Site: COEUR SANS FRONTIERES KIHINDO - Site 79
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  'aa08d264-d8e9-426b-8bd2-30a5ae9bfe68',
  '2df32d8a-96f9-4c0c-a6d1-4481c084c212',
  'COEUR SANS FRONTIERES KIHINDO - Site 79',
  'KIHINDO',
  1,
  0,
  100,
  100,
  1
);

-- Client: CSF KANYARUCHINYA (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '8091dbae-f950-4bc3-86eb-e3bccf0d868a',
  'PHYSIQUE',
  'CSF KANYARUCHINYA',
  NULL,
  'Mr ADOLPHE BABU BONENDELE',
  NULL,
  NULL,
  'KANYARUCHINA',
  'USD',
  'ACTIF'
);

-- Site: CSF KANYARUCHINYA - Site 80
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '320317fd-8e3a-4d53-a4eb-c21e7e8605db',
  '8091dbae-f950-4bc3-86eb-e3bccf0d868a',
  'CSF KANYARUCHINYA - Site 80',
  'KANYARUCHINA',
  1,
  0,
  100,
  100,
  1
);

-- Client: PACIFIQUE 2 (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '7debb31b-6273-45b9-8458-1e6cebc4df8b',
  'PHYSIQUE',
  'PACIFIQUE 2',
  NULL,
  'PACIFIQUE',
  NULL,
  NULL,
  'Q.KYESHERO',
  'USD',
  'ACTIF'
);

-- Site: PACIFIQUE 2 - Site 81
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '5952cd99-098b-4044-9dab-1d0ec8279bfb',
  '7debb31b-6273-45b9-8458-1e6cebc4df8b',
  'PACIFIQUE 2 - Site 81',
  'Q.KYESHERO',
  1,
  0,
  60,
  60,
  1
);

-- Client: FURAHA AMANI (PHYSIQUE)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'a9ea9dc7-660c-43c1-a674-86b6da27544f',
  'PHYSIQUE',
  'FURAHA AMANI',
  NULL,
  'FURAHA AMANI',
  '0993494343',
  NULL,
  'Q.KYESHERO,AV ENSEIGNANT',
  'USD',
  'ACTIF'
);

-- Site: FURAHA AMANI - Site 82
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '9a9b0032-19a6-47f4-a747-bdc7c70d7fc4',
  'a9ea9dc7-660c-43c1-a674-86b6da27544f',
  'FURAHA AMANI - Site 82',
  'Q.KYESHERO,AV ENSEIGNANT',
  1,
  0,
  100,
  100,
  1
);

-- Import Summary:
-- Clients to create: 79
-- Sites to create: 82
-- Total rows processed: 82
-- Client Types: 2 MORALE (companies), 77 PHYSIQUE (individuals)