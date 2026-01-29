-- Excel Import SQL Statements
-- Generated on: 2026-01-29T21:23:40.538Z

-- Client: James Batende
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'fb1b38f2-132a-43e5-b7a9-79632e594d19',
  'MORALE',
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
  'e676caf6-936b-4167-90fc-0e96766df615',
  'fb1b38f2-132a-43e5-b7a9-79632e594d19',
  'Residence James',
  '276, Av Masisi, Q Katindo',
  1,
  0,
  60,
  60,
  1
);

-- Client: Souzy Musukali
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '96ee202d-2ca7-46e3-9814-43fd2ea30c90',
  'MORALE',
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
  '3ab717de-2188-4615-af0f-823576510f47',
  '96ee202d-2ca7-46e3-9814-43fd2ea30c90',
  'Residence Souzy',
  'Q Himbi',
  2,
  0,
  150,
  75,
  1
);

-- Client: Ngeve Visso Philemon
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '045c0a75-6202-4706-bda1-6a855324a122',
  'MORALE',
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
  'ea1e2cfb-71ee-4272-8058-250d5caf2a9b',
  '045c0a75-6202-4706-bda1-6a855324a122',
  'Emmanuel',
  '287, Av Lusaka, Q Kyeshero',
  2,
  0,
  140,
  70,
  1
);

-- Client: Bio Kivu
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd370527b-70bc-478b-a20f-68dd6cc15e72',
  'MORALE',
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
  'afa3f209-214a-4c6a-84f1-410aecf5aff6',
  'd370527b-70bc-478b-a20f-68dd6cc15e72',
  'Bio Kivu',
  'Q. Bujovu',
  2,
  0,
  150,
  75,
  1
);

-- Client: Ahadi Senge Phidias
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '65acf53f-69a2-41a9-9410-403ed09b6125',
  'MORALE',
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
  'a7a8334b-bba0-4793-8a56-f8657860d6f9',
  '65acf53f-69a2-41a9-9410-403ed09b6125',
  'Residence Phidias',
  '12, Av des Rond-point, Q. Les Volcans, Rue Lyn Lussy',
  2,
  0,
  140,
  70,
  1
);

-- Client: Virunga
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '8218dadc-2dfa-4f2c-86d7-7ddacdf766ce',
  'MORALE',
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
  'd87f005d-99e9-4574-9d43-19c280654353',
  '8218dadc-2dfa-4f2c-86d7-7ddacdf766ce',
  'Entrepot Virunga',
  'Q. Virunga',
  1,
  0,
  70,
  70,
  1
);

-- Client: Bisimwa Rodrigue (Chantier)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'b7ee70ca-c94a-4932-a7c2-6ea867f4b438',
  'MORALE',
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
  'e84461dd-0cab-48e6-9a26-8b5a9ff2d9d4',
  'b7ee70ca-c94a-4932-a7c2-6ea867f4b438',
  'Bisimwa Rodrigue (Chantier) - Site 7',
  NULL,
  2,
  0,
  160,
  80,
  1
);

-- Client: Bisimwa Rodrigue (Famille)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '265cddb5-0e29-4085-a324-63362ff8bc1d',
  'MORALE',
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
  '765ada43-1183-4929-b2fb-fdd5078c26c8',
  '265cddb5-0e29-4085-a324-63362ff8bc1d',
  'Bisimwa Rodrigue (Famille) - Site 8',
  NULL,
  1,
  0,
  80,
  80,
  1
);

-- Client: Makuru Amani Bienvenu
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '0a23b19c-5da7-4024-9b41-e5bf192198d4',
  'MORALE',
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
  'bfef96e0-89b4-4f40-9acb-cf9438255098',
  '0a23b19c-5da7-4024-9b41-e5bf192198d4',
  'Makuru Amani Bienvenu - Site 9',
  '16, Av Abattoir, Q Kyeshero',
  1,
  0,
  80,
  80,
  1
);

-- Client: CMDIPRO
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '2c6143a4-abce-4a4d-84c6-73e06b3daceb',
  'MORALE',
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
  'a49344c1-4185-4c11-b489-54545bc4350d',
  '2c6143a4-abce-4a4d-84c6-73e06b3daceb',
  'CMDIPRO - Site 10',
  'Q. Kyeshero',
  2,
  0,
  140,
  70,
  1
);

-- Client: Herman Hangi
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '12232ce2-2e86-4b42-817b-89b2bcb6853f',
  'MORALE',
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
  '42d87c5b-4e9f-403e-8f59-5d2132a18ac2',
  '12232ce2-2e86-4b42-817b-89b2bcb6853f',
  'Herman Hangi - Site 11',
  'Q. Kyeshero, Av. Lusaka',
  2,
  0,
  160,
  80,
  1
);

-- Client: Okasso Djungambulu Felix
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '835e82ec-4f5f-46fe-9211-42643137b623',
  'MORALE',
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
  'f6503f30-7052-4c40-9d9f-cc3d5d9a95d4',
  '835e82ec-4f5f-46fe-9211-42643137b623',
  'Okasso Djungambulu Felix - Site 12',
  'Av. Orchide Q. Les Volcans',
  1,
  0,
  75,
  75,
  1
);

-- Client: Lucien Ntautabazi
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '753a1c0f-4eca-4d5e-8f6f-d844c1e6400d',
  'MORALE',
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
  'efa25a67-e525-46b8-b7a7-a97e61956477',
  '753a1c0f-4eca-4d5e-8f6f-d844c1e6400d',
  'Lucien Ntautabazi - Site 13',
  'Q. Les Volcans, Rue Lyn Lusi, 061',
  1,
  0,
  70,
  70,
  1
);

-- Client: Zephirin
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd8588765-f063-48c5-aa6b-9d6915cb22d6',
  'MORALE',
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
  '7d81416b-c389-4821-bee7-fba617d6c40f',
  'd8588765-f063-48c5-aa6b-9d6915cb22d6',
  'Zephirin - Site 14',
  'Q. Kyeshero Av des Eglises',
  2,
  0,
  120,
  60,
  1
);

-- Client: Valentin Mudja
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '54bfd61d-ce69-42ae-9ffe-d89f2c234349',
  'MORALE',
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
  '08728682-6db1-4cd1-bc6b-1ae5ad670a7c',
  '54bfd61d-ce69-42ae-9ffe-d89f2c234349',
  'Valentin Mudja - Site 15',
  'Q. Les Volcans',
  1,
  0,
  50,
  50,
  1
);

-- Client: Beroya
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '2eb3afeb-97c4-44ca-84ec-5bf732600ccb',
  'MORALE',
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
  '2a492d02-93e4-427f-8d53-970743b0966b',
  '2eb3afeb-97c4-44ca-84ec-5bf732600ccb',
  'Beroya',
  'Q Katindo',
  1,
  0,
  75,
  75,
  1
);

-- Client: Bisimwa Rodrigue
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '6cee5ed6-c088-469c-987b-db278ec23423',
  'MORALE',
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
  'f692b63b-a379-4bc6-a93e-9fae2084d022',
  '6cee5ed6-c088-469c-987b-db278ec23423',
  'Residence Rodrigue',
  'Q. Kyeshero',
  2,
  0,
  140,
  70,
  1
);

-- Client: Save Communities in Conflicts
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd41c1123-6684-48d3-8021-22f461f00660',
  'MORALE',
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
  'a93ddf50-74a4-47d3-9d18-cfc2229d32c7',
  'd41c1123-6684-48d3-8021-22f461f00660',
  'Save Communities',
  '100, Av de la Conference, Q Kyeshero',
  2,
  0,
  150,
  75,
  1
);

-- Client: UAVOU
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '5c855e00-72f0-483d-bddb-76f4090ca093',
  'MORALE',
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
  '3b3096a9-e629-4374-b49b-077b36c33b6f',
  '5c855e00-72f0-483d-bddb-76f4090ca093',
  'UAVOU - Site 19',
  NULL,
  1,
  0,
  50,
  50,
  1
);

-- Client: SAFI
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'efae93ee-8fc7-4202-9970-2bbf7c8ef1c5',
  'MORALE',
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
  'd9bb924b-407d-482c-bc28-380a1a545aac',
  'efae93ee-8fc7-4202-9970-2bbf7c8ef1c5',
  'SAFI - Site 20',
  'Av. Polyclinique, Q Kyeshero',
  4,
  0,
  320,
  80,
  1
);

-- Client: Balola Bichonne Justin
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'bd702aae-aa7c-4a2e-9d83-742afc66c50b',
  'MORALE',
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
  '62cbc2bd-8aef-43ff-ad91-8307ee46b4d1',
  'bd702aae-aa7c-4a2e-9d83-742afc66c50b',
  'Balola Bichonne Justin - Site 21',
  'Q Virunga',
  4,
  0,
  220,
  55,
  1
);

-- Client: Willy Lombé Njaza
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '3c704e29-c20a-4c93-a817-2ffb58640600',
  'MORALE',
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
  'ee081810-2b0b-40c3-9d35-7f6966d4484f',
  '3c704e29-c20a-4c93-a817-2ffb58640600',
  'Usine Rodrigue',
  'Q Kyeshero',
  1,
  0,
  60,
  60,
  1
);

-- Client: Kabinda Fikiri Lea restaurant
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd766dd93-3bf6-4406-9ad8-173e08da6d68',
  'MORALE',
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
  'e2f58c56-6695-4e64-9a38-4c125bce2b7a',
  'd766dd93-3bf6-4406-9ad8-173e08da6d68',
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
  'a7018ed7-3815-45de-8dc1-eaba1e7a77c5',
  'd766dd93-3bf6-4406-9ad8-173e08da6d68',
  'Kabinda fikiri Lea Restaurant - Site 67',
  '267,Av Duu Lac,Q.Katindo',
  1,
  0,
  80,
  80,
  1
);

-- Client: Bosconia
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'ff19b3e3-f582-49a7-b64c-8504f860d9b5',
  'MORALE',
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
  '48dcec4c-015b-4ca1-9001-4cda5e94d4f7',
  'ff19b3e3-f582-49a7-b64c-8504f860d9b5',
  'Bosconia - Site 24',
  NULL,
  2,
  0,
  160,
  80,
  1
);

-- Client: Belle Vie Logistique
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '1bf23235-7fa2-4e70-961a-4c03fec701cb',
  'MORALE',
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
  '2d1091e4-46bb-4743-86d6-5fe9cc41d494',
  '1bf23235-7fa2-4e70-961a-4c03fec701cb',
  'Garage Belle Vie',
  'Av. Bishweka, Q Les Volcans',
  1,
  0,
  120,
  120,
  1
);

-- Client: Yves Bwema
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'becbe030-2cdf-4e7c-b0f4-3eb222ec1f41',
  'MORALE',
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
  'bb881ef0-7ce5-4c21-a359-e67d9b252897',
  'becbe030-2cdf-4e7c-b0f4-3eb222ec1f41',
  'Yves Bwema - Site 26',
  'Q. Kyeshero',
  2,
  0,
  150,
  75,
  1
);

-- Client: Zero Panne
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '6fd63d75-4705-4a11-b6b6-5e8e8b254f7d',
  'MORALE',
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
  'dafc0254-6cef-4ea0-9352-7f5cf9399433',
  '6fd63d75-4705-4a11-b6b6-5e8e8b254f7d',
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
  'ce99ae8f-6d6f-401d-9f0f-57ab2ca30dcf',
  '6fd63d75-4705-4a11-b6b6-5e8e8b254f7d',
  'Zero Panne - Site 58',
  'Q.Mabanga Nord',
  1,
  0,
  70,
  70,
  1
);

-- Client: Fatuma Bukoko Gabrielle
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'cad7288e-891f-4182-847d-fe2f0c32d9be',
  'MORALE',
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
  '21ef2bb6-f482-4930-9915-fc4355886faa',
  'cad7288e-891f-4182-847d-fe2f0c32d9be',
  'boutique Fatuma',
  NULL,
  1,
  0,
  80,
  80,
  1
);

-- Client: Zaina Lunda
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '36a0deef-1125-46c8-8fec-4bafacc6f1cb',
  'MORALE',
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
  '2d801bf1-eb52-4e11-b585-672593a012a2',
  '36a0deef-1125-46c8-8fec-4bafacc6f1cb',
  'Zaina Lunda - Site 29',
  'Commune de Karisimbi Q. Mabanga',
  2,
  0,
  150,
  75,
  1
);

-- Client: Rachel Safari (RVA)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'a98bbe99-3ff7-48eb-a0ef-cb22a25f59aa',
  'MORALE',
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
  '26a0002f-1b92-4a84-8eaf-838c2d7edd21',
  'a98bbe99-3ff7-48eb-a0ef-cb22a25f59aa',
  'Chantier RVA',
  'Q. Himbi',
  2,
  0,
  150,
  75,
  1
);

-- Client: Bishworld Auto
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '8ad36566-e630-45d7-8f15-22fc590b839a',
  'MORALE',
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
  '184e789a-091d-41fc-98ae-85327a2b61be',
  '8ad36566-e630-45d7-8f15-22fc590b839a',
  'Bishworld',
  '05, Av Walikale, Q. Les Volcans',
  2,
  0,
  150,
  75,
  1
);

-- Client: Kangamutima Zabika Christophe
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'dbdeaf68-cbb9-4fb0-a27d-e46de53f391d',
  'MORALE',
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
  'd0f0f9d3-ab7c-4a6d-97b1-54b64675fd18',
  'dbdeaf68-cbb9-4fb0-a27d-e46de53f391d',
  'Res Christophe',
  '35A, Av. De la mission, Q. Himbi',
  1,
  0,
  75,
  75,
  1
);

-- Client: Baseme Rwicha Victoire
BASEME RWICHA Victoire
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '98f9d0b2-0b79-4c05-b95e-57f86cc8890e',
  'MORALE',
  'Baseme Rwicha Victoire
BASEME RWICHA Victoire',
  NULL,
  'Baseme Rwicha Victoire
BASEME RWICHA Victoire',
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
  '278c7646-bf95-4f17-9b07-ade49a819845',
  '98f9d0b2-0b79-4c05-b95e-57f86cc8890e',
  'Res. Victoire',
  'Q. Kyeshero',
  2,
  0,
  150,
  75,
  1
);

-- Client: Congo Handicap
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '3fe8267f-b56e-4938-bb36-40edd56c1425',
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
  '47e84ce1-0d0d-4b8c-b82d-dd382e9c618c',
  '3fe8267f-b56e-4938-bb36-40edd56c1425',
  'Congo Handicap - Site 34',
  'Q. Mabanga Sud',
  2,
  0,
  150,
  75,
  1
);

-- Client: Rachell Safari (TMK)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'cf3a7160-ce1e-40d1-9d72-b09a7566ac77',
  'MORALE',
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
  'cf73e75e-34e4-4759-8295-4828a20fb5aa',
  'cf3a7160-ce1e-40d1-9d72-b09a7566ac77',
  'Rachell Safari (TMK) - Site 35',
  NULL,
  1,
  0,
  75,
  75,
  1
);

-- Client: KABU MBOMBO Blandine
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'dee51301-66ae-408c-b8ed-ef085d757f9e',
  'MORALE',
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
  '3e9f278e-e7c4-448f-8664-406968955c14',
  'dee51301-66ae-408c-b8ed-ef085d757f9e',
  'Papeterie',
  'Q. le volcan AV. Boungain ville N.23',
  1,
  0,
  70,
  70,
  1
);

-- Client: MWATI MAMBO
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '751ae6ec-4101-46c8-bccf-4dc052198433',
  'MORALE',
  'MWATI MAMBO',
  NULL,
  'MWATI',
  NULL,
  NULL,
  'Q. Kyeshero
Q.keshero',
  'USD',
  'ACTIF'
);

-- Site: Chantier mwati
INSERT INTO sites_gas (
  id, client_id, nom_site, adresse_physique, effectif_jour_requis,
  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
) VALUES (
  '5e35cf62-9366-4e55-acea-dcca24f2dc55',
  '751ae6ec-4101-46c8-bccf-4dc052198433',
  'Chantier mwati',
  'Q. Kyeshero
Q.keshero',
  2,
  0,
  200,
  100,
  1
);

-- Client: BALUARTE
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '749a1f1d-9775-4339-8317-c252b65bee6f',
  'MORALE',
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
  'a55a9003-cb96-4b25-b37d-df3086155975',
  '749a1f1d-9775-4339-8317-c252b65bee6f',
  'Orphelinat',
  'Q.Keshero AV. Kituku N.53',
  2,
  0,
  160,
  80,
  1
);

-- Client: BIENFAIT LUNDA
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'a5d28c63-f7f5-4640-831d-9a2f74a4724e',
  'MORALE',
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
  '577f31dd-36b6-492d-b0aa-2d13acce0119',
  'a5d28c63-f7f5-4640-831d-9a2f74a4724e',
  'Petit pari',
  NULL,
  2,
  0,
  150,
  75,
  1
);

-- Client: EDOUARD MUSHAGALUSA
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4c4b3843-92dd-4c5d-b620-8b01e83f95ab',
  'MORALE',
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
  'c0c686b0-b311-46b4-844d-3fdf5a8682eb',
  '4c4b3843-92dd-4c5d-b620-8b01e83f95ab',
  'Res. Edouard',
  'Q. Kyeshoro Av. Magene',
  1,
  0,
  70,
  70,
  1
);

-- Client: MPARANYI MURHULA BAUDOUIN
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '27b159bf-6358-4f6f-be43-a114419963d0',
  'MORALE',
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
  'fcc413ca-0d1f-4b14-b1ee-54a609038ce0',
  '27b159bf-6358-4f6f-be43-a114419963d0',
  'MPARANYI MURHULA BAUDOUIN - Site 41',
  'GOMA Q.Kyeshero, kituku',
  1,
  0,
  70,
  70,
  1
);

-- Client: GUILLAIN
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd57c2cad-43d0-494f-9155-54ecfb7afb3b',
  'MORALE',
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
  '1331a5d1-4256-4ac6-89e8-98802209d22e',
  'd57c2cad-43d0-494f-9155-54ecfb7afb3b',
  'GUILLAIN - Site 42',
  'Q. le volcan',
  2,
  0,
  140,
  70,
  1
);

-- Client: CLAUDIA
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'a2d2c8a0-509b-4f07-b13a-c1d6f0fb2326',
  'MORALE',
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
  '5f517b09-50ce-4e6d-b957-bc8d79615149',
  'a2d2c8a0-509b-4f07-b13a-c1d6f0fb2326',
  'CLAUDIA - Site 43',
  'Q. Keshero',
  1,
  0,
  70,
  70,
  1
);

-- Client: COEUR SANS FRONTIERES
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '201b38ec-2849-4b8a-b6e9-0a1f96e777ea',
  'MORALE',
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
  '14ac96e4-7b01-4bbf-aff3-6a57017c3a98',
  '201b38ec-2849-4b8a-b6e9-0a1f96e777ea',
  'COEUR SANS FRONTIERES - Site 44',
  'Q. Himbi Av. Du lac',
  2,
  0,
  300,
  150,
  1
);

-- Client: Mumuza Muhindo Musubao(Sarah)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4e0080d2-369b-4ca1-9cdb-f7af9f7d2e8a',
  'MORALE',
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
  'a6912f78-2758-4041-829f-fab6f1a5d36d',
  '4e0080d2-369b-4ca1-9cdb-f7af9f7d2e8a',
  'Mumuza Muhindo Musubao(Sarah) - Site 45',
  'Q. Himbi',
  2,
  0,
  160,
  80,
  1
);

-- Client: Yannick Musoso
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'fb79d64f-b77e-47be-8df5-cae8514f1cb5',
  'MORALE',
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
  'b5c29eff-24a1-439c-ac1b-af290dde082b',
  'fb79d64f-b77e-47be-8df5-cae8514f1cb5',
  'Yannick Musoso - Site 46',
  'Maganga N 108',
  1,
  0,
  80,
  80,
  1
);

-- Client: Herman Hangi (poulailller)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'aa38684f-6859-416a-9b88-06b97b48bf09',
  'MORALE',
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
  '71813e43-b070-45d7-92fe-170c430bd17b',
  'aa38684f-6859-416a-9b88-06b97b48bf09',
  'Herman Hangi (poulailller) - Site 47',
  NULL,
  1,
  0,
  80,
  80,
  1
);

-- Client: ITEGWA NCHIKO DESIRE
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '04b40229-4320-45d4-ab8e-5faddfe6a221',
  'MORALE',
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
  'df9d2f67-3ff6-4715-97ab-d24175a13529',
  '04b40229-4320-45d4-ab8e-5faddfe6a221',
  'ITEGWA NCHIKO DESIRE - Site 48',
  'Kyeshoro AV. Topographe N.5',
  2,
  0,
  100,
  50,
  1
);

-- Client: Bulimwengu Walanga Albert
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4f814169-202f-42ff-9d9f-c79944a72ee3',
  'MORALE',
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
  'f76d4309-2fca-4ebb-85f2-31228415aabe',
  '4f814169-202f-42ff-9d9f-c79944a72ee3',
  'Bulimwengu Walanga Albert - Site 49',
  'Keshero Av. Kizito',
  1,
  0,
  80,
  80,
  1
);

-- Client: Albert BULIMWENGU
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '13cad842-7a06-4617-ae28-105821f70ee5',
  'MORALE',
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
  '62d146ab-2b24-4a77-91b1-95ac9cd4ba91',
  '13cad842-7a06-4617-ae28-105821f70ee5',
  'Albert BULIMWENGU - Site 50',
  NULL,
  1,
  0,
  60,
  60,
  1
);

-- Client: Freedom Plazza Restaurant
Freedom Plazza Restaurant
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '1a77dd47-6bb9-46ca-9f97-75c59a220c6b',
  'MORALE',
  'Freedom Plazza Restaurant
Freedom Plazza Restaurant',
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
  'f6771e0a-5919-4a18-99d3-481d5771fc16',
  '1a77dd47-6bb9-46ca-9f97-75c59a220c6b',
  'Himbi, av. Felix,c.goma',
  'imbi, Av Felix, c. Goma',
  1,
  0,
  70,
  70,
  1
);

-- Client: LEA KABINDA RESIDENCE
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '7125d30e-7222-4eae-b0e5-c6f875cc8be4',
  'MORALE',
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
  '13eaa50b-e8de-49de-8a9e-1f292f76ce02',
  '7125d30e-7222-4eae-b0e5-c6f875cc8be4',
  'RESIDENCE LEA KABINDA',
  'Q.HIMBI',
  1,
  0,
  80,
  80,
  1
);

-- Client: PAPY ABEDI USSENI
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '987513af-d34e-4c9a-adc9-1701677df395',
  'MORALE',
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
  '95f96b5b-86fd-4080-a644-6c68e0e3a175',
  '987513af-d34e-4c9a-adc9-1701677df395',
  'PAPY ABEDI USSENI - Site 53',
  'Av. CARMEL, N 06,Q.KATINDO,C/GOMA',
  2,
  0,
  160,
  80,
  1
);

-- Client: Freedom Plazza Batiment
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '552367a4-6ea4-4613-95bb-083443dd0100',
  'MORALE',
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
  '1578259b-206d-49ad-8661-0da9f5a6b87a',
  '552367a4-6ea4-4613-95bb-083443dd0100',
  'Freedom Plazza Batiment - Site 54',
  'HIMBI,AV FELIX,C.GOMA',
  1,
  0,
  70,
  70,
  1
);

-- Client: NGUBA JOSEPH
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '09d4836d-3088-4b71-a3f0-d1a1e5708ad8',
  'MORALE',
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
  '97b839e1-4974-488c-a162-dc6614cfacf5',
  '09d4836d-3088-4b71-a3f0-d1a1e5708ad8',
  'NGUBA JOSEPH - Site 55',
  'Q.HIMBI,AV MAGANGA',
  1,
  0,
  80,
  80,
  1
);

-- Client: CENTRE HOSPITALIER. HESHIMA
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'fb6e86cb-3ff1-432e-8eea-96edf388d0f1',
  'MORALE',
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
  '055408bb-a12a-4f2d-b97e-bcff1900a215',
  'fb6e86cb-3ff1-432e-8eea-96edf388d0f1',
  'CENTRE HOSPITALIER. HESHIMA - Site 56',
  'Q,KKYYESHERO,AV KARIBU',
  2,
  0,
  200,
  100,
  1
);

-- Client: ANUNGA THERESE HABITATION
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '2b0bb39e-7bfd-4c77-ba38-74e284eec3a2',
  'MORALE',
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
  'e1a45863-c497-44a4-909f-e313597b8fb7',
  '2b0bb39e-7bfd-4c77-ba38-74e284eec3a2',
  'ANUNGA THERESE HABITATION - Site 57',
  'KESHERO',
  1,
  0,
  70,
  70,
  1
);

-- Client: Residence Joelle MWAMINI
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'db02c477-1d96-4513-9cda-51ed6f651264',
  'MORALE',
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
  'a504ce7b-3193-4540-a19c-fcee4cfd45cc',
  'db02c477-1d96-4513-9cda-51ed6f651264',
  'Residence Joelle MWAMINI - Site 59',
  'Q.KESHHERO, Av Abbatoir',
  1,
  0,
  70,
  70,
  1
);

-- Client: Pacifique
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '0d162625-b0b2-40e3-ad62-5e079a19c56a',
  'MORALE',
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
  '97f98bd3-3a23-4b33-bddb-333fda60cdb3',
  '0d162625-b0b2-40e3-ad62-5e079a19c56a',
  'Pacifique - Site 60',
  NULL,
  1,
  0,
  70,
  70,
  1
);

-- Client: MAKURU BIENVENU
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'c1c13da5-b3dc-4c74-bee8-43b958a1a4de',
  'MORALE',
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
  'b547ebb2-5443-4759-a4d2-fe3e58a5fa78',
  'c1c13da5-b3dc-4c74-bee8-43b958a1a4de',
  'MAKURU BIENVENU - Site 61',
  NULL,
  1,
  0,
  80,
  80,
  1
);

-- Client: Coeur Sans Frontieres/ KIWANJA
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'd649b658-5c45-4fb6-9f64-126ff9f9d19c',
  'MORALE',
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
  '3fba0135-ac78-4513-b3c9-051190183d0e',
  'd649b658-5c45-4fb6-9f64-126ff9f9d19c',
  'Coeur Sans Frontieres/ KIWANJA - Site 62',
  'Kiwanja',
  2,
  0,
  150,
  75,
  1
);

-- Client: Coeur Sans Frontieres KIWANJA
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'e57b9ba7-b004-4e71-b41c-11569fa2574e',
  'MORALE',
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
  'fa4687f1-a874-471c-8a81-7953cba8aec9',
  'e57b9ba7-b004-4e71-b41c-11569fa2574e',
  'Coeur Sans Frontieres KIWANJA - Site 63',
  'kiwanja',
  2,
  0,
  300,
  150,
  1
);

-- Client: Coeur-Sans- Frontiere
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '4ea1801d-8903-4a64-806d-97a59bb249fc',
  'MORALE',
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
  'c9e20106-487a-40a3-a66e-80d42e39dae8',
  '4ea1801d-8903-4a64-806d-97a59bb249fc',
  'Coeur-Sans- Frontiere - Site 64',
  'Q.HIMBI',
  2,
  0,
  150,
  75,
  1
);

-- Client: Congo- Handicap
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '9a5b7e40-4611-4d6d-bec9-f729a316ad9e',
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
  '90e33528-2e7b-4bd2-a55a-147f6436e6c5',
  '9a5b7e40-4611-4d6d-bec9-f729a316ad9e',
  'Congo- Handicap - Site 65',
  NULL,
  2,
  0,
  200,
  100,
  1
);

-- Client: MATABISHI MARCELLIN
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '33b48e4c-057e-4a0f-972c-3b03687c1fba',
  'MORALE',
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
  'fcfedbd8-2960-4ae3-851a-5828b18ca3bd',
  '33b48e4c-057e-4a0f-972c-3b03687c1fba',
  'MATABISHI MARCELLIN - Site 66',
  'Q.LES VOLCANS',
  1,
  0,
  60,
  60,
  1
);

-- Client: JOELLE MWAMINI
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '7a956f8b-39ad-48d4-84a5-7a7c9e5d2075',
  'MORALE',
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
  '3bf6f327-20e8-4fb7-8472-8c8b69464047',
  '7a956f8b-39ad-48d4-84a5-7a7c9e5d2075',
  'JOELLE MWAMINI - Site 68',
  NULL,
  1,
  0,
  70,
  70,
  1
);

-- Client: QUICK COLOR SOLUTION
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '5e14c8bb-fd66-4ed4-b9d4-f41a37f4b105',
  'MORALE',
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
  '0a49e7b3-9f57-47fe-8d8a-73f5efae741c',
  '5e14c8bb-fd66-4ed4-b9d4-f41a37f4b105',
  'QUICK COLOR SOLUTION - Site 69',
  'Q.Kyeshero, Av. Abattoir',
  1,
  0,
  100,
  100,
  1
);

-- Client: KIBANCHA FABRICE
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '5ca96c23-24d8-443b-9c6f-3c4f8155d56e',
  'MORALE',
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
  'bbed56d1-8b34-43ca-bba0-ae04020c7f33',
  '5ca96c23-24d8-443b-9c6f-3c4f8155d56e',
  'KIBANCHA FABRICE - Site 70',
  'Q.HIMBI,AV.DU LAC,N 319',
  1,
  0,
  70,
  70,
  1
);

-- Client: FAIDA JUSTINE
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'cb93d742-bf7d-424f-a5af-e1f77181c88c',
  'MORALE',
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
  '772682c5-d038-4566-921c-ef0308251361',
  'cb93d742-bf7d-424f-a5af-e1f77181c88c',
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
  '42a6ac16-cbaa-4676-8afc-5d866bc17235',
  'cb93d742-bf7d-424f-a5af-e1f77181c88c',
  'FAIDA JUSTINE - Site 76',
  'Q.HIMBI,AV UVIRA',
  1,
  0,
  80,
  80,
  1
);

-- Client: UFEDOC
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'ba9bb928-babe-44d1-8200-29e074e9c798',
  'MORALE',
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
  '8b8b0374-274a-401c-942a-22aed0e42b48',
  'ba9bb928-babe-44d1-8200-29e074e9c798',
  'UFEDOC - Site 72',
  'Q.HIMBI',
  1,
  0,
  75,
  75,
  1
);

-- Client: Mr Bazuzi Nickel
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '3bc118f9-c335-4731-952c-85b7990e0de6',
  'MORALE',
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
  '4ee135d8-9846-430f-91df-384c51dee901',
  '3bc118f9-c335-4731-952c-85b7990e0de6',
  'Mr Bazuzi Nickel - Site 73',
  'Q.KYESHERO,Faculte de Droit',
  1,
  0,
  70,
  70,
  1
);

-- Client: Impala Bar
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '1ea0fefd-d99e-4d20-9447-86b029ff1f30',
  'MORALE',
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
  'fd5fc78d-77d5-4674-ac91-a31fae9e8947',
  '1ea0fefd-d99e-4d20-9447-86b029ff1f30',
  'Impala Bar - Site 74',
  'Q.KATOYI',
  1,
  0,
  70,
  70,
  1
);

-- Client: ALBERT
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'c524782b-15fe-4794-b49b-264ab2249e61',
  'MORALE',
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
  'a12207c9-3dcb-49d4-8443-a199c2cc0013',
  'c524782b-15fe-4794-b49b-264ab2249e61',
  'ALBERT - Site 75',
  'Q.KYESHERO',
  1,
  0,
  80,
  80,
  1
);

-- Client: Save Communities in Conflits (SCC)
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '7f426dd5-c402-44a3-b5b4-e945b16460bf',
  'MORALE',
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
  'de5a397c-6f03-4b7b-bcc9-343c7d78ea34',
  '7f426dd5-c402-44a3-b5b4-e945b16460bf',
  'Save Communities in Conflits (SCC) - Site 77',
  'Q.HIMBI',
  2,
  0,
  150,
  75,
  1
);

-- Client: COEUR SANS FRONTIERES SAKE
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '03c1f90e-e814-4e74-8703-2799351a1533',
  'MORALE',
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
  '10d19745-329a-4842-a97e-7bcc53ccfd13',
  '03c1f90e-e814-4e74-8703-2799351a1533',
  'COEUR SANS FRONTIERES SAKE - Site 78',
  'SAKE',
  1,
  0,
  100,
  100,
  1
);

-- Client: COEUR SANS FRONTIERES KIHINDO
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  'c0b84101-59d1-4cbe-ba9a-6b2860cb1f87',
  'MORALE',
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
  'c1f30dbf-25bf-4cb7-9d26-7fb524f4ce97',
  'c0b84101-59d1-4cbe-ba9a-6b2860cb1f87',
  'COEUR SANS FRONTIERES KIHINDO - Site 79',
  'KIHINDO',
  1,
  0,
  100,
  100,
  1
);

-- Client: CSF KANYARUCHINYA
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '18150f36-e146-4931-b62b-49cabf0e5e7a',
  'MORALE',
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
  '8d380abe-60d9-4825-8404-c55c2a08e32b',
  '18150f36-e146-4931-b62b-49cabf0e5e7a',
  'CSF KANYARUCHINYA - Site 80',
  'KANYARUCHINA',
  1,
  0,
  100,
  100,
  1
);

-- Client: PACIFIQUE 2
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '81ddb94d-8dbc-4ce5-a3dc-482d8ed1794b',
  'MORALE',
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
  '2f148365-fa36-4875-9631-9a8fd9b78355',
  '81ddb94d-8dbc-4ce5-a3dc-482d8ed1794b',
  'PACIFIQUE 2 - Site 81',
  'Q.KYESHERO',
  1,
  0,
  60,
  60,
  1
);

-- Client: FURAHA AMANI
INSERT OR IGNORE INTO clients_gas (
  id, type_client, nom_entreprise, nif, contact_nom, telephone,
  contact_email, adresse_facturation, devise_preferee, statut
) VALUES (
  '684784ab-ff84-4a68-86b1-c4fb1ff1bfc9',
  'MORALE',
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
  '26536d37-98ea-4658-a3d1-b6cfefb3e321',
  '684784ab-ff84-4a68-86b1-c4fb1ff1bfc9',
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