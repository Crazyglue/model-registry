/* eslint-disable camelcase */
import { mockRegisteredModelList } from '~/__mocks__/mockRegisteredModelsList';
import { mockModelVersion } from '~/__mocks__/mockModelVersion';
import { mockRegisteredModel } from '~/__mocks__/mockRegisteredModel';
import { verifyRelativeURL } from '~/__tests__/cypress/cypress/utils/url';
import { labelModal, modelRegistry } from '~/__tests__/cypress/cypress/pages/modelRegistry';
import { mockModelVersionList } from '~/__mocks__/mockModelVersionList';
import { be } from '~/__tests__/cypress/cypress/utils/should';
import type { ModelRegistry, ModelVersion, RegisteredModel } from '~/app/types';
import { ModelState } from '~/app/types';
import { mockBFFResponse } from '~/__mocks__/utils';
import { mockModelRegistry } from '~/__mocks__/mockModelRegistry';
import { MODEL_REGISTRY_API_VERSION } from '~/__tests__/cypress/cypress/support/commands/api';
import { registeredModelArchive } from '~/__tests__/cypress/cypress/pages/modelRegistryView/registeredModelArchive';

type HandlersProps = {
  registeredModels?: RegisteredModel[];
  modelVersions?: ModelVersion[];
  modelRegistries?: ModelRegistry[];
};

const initIntercepts = ({
  registeredModels = [
    mockRegisteredModel({
      name: 'model 1',
      id: '1',
      labels: [
        'Financial data',
        'Fraud detection',
        'Test label',
        'Machine learning',
        'Next data to be overflow',
        'Test label x',
        'Test label y',
        'Test label z',
      ],
      state: ModelState.ARCHIVED,
    }),
    mockRegisteredModel({ id: '2', name: 'model 2', state: ModelState.ARCHIVED }),
    mockRegisteredModel({ id: '3', name: 'model 3' }),
    mockRegisteredModel({ id: '4', name: 'model 4' }),
  ],
  modelVersions = [
    mockModelVersion({ author: 'Author 1', registeredModelId: '2' }),
    mockModelVersion({ name: 'model version' }),
  ],
  modelRegistries = [
    mockModelRegistry({
      name: 'modelregistry-sample',
      description: 'New model registry',
      displayName: 'Model Registry Sample',
    }),
    mockModelRegistry({
      name: 'modelregistry-sample-2',
      description: 'New model registry 2',
      displayName: 'Model Registry Sample 2',
    }),
  ],
}: HandlersProps) => {
  cy.interceptApi(
    `GET /api/:apiVersion/model_registry`,
    {
      path: { apiVersion: MODEL_REGISTRY_API_VERSION },
    },
    mockBFFResponse(modelRegistries),
  );

  cy.interceptApi(
    `GET /api/:apiVersion/model_registry/:modelRegistryName/registered_models`,
    {
      path: { modelRegistryName: 'modelregistry-sample', apiVersion: MODEL_REGISTRY_API_VERSION },
    },
    mockBFFResponse(mockRegisteredModelList({ items: registeredModels })),
  );

  cy.interceptApi(
    `GET /api/:apiVersion/model_registry/:modelRegistryName/model_versions/:modelVersionId`,
    {
      path: {
        modelRegistryName: 'modelregistry-sample',
        apiVersion: MODEL_REGISTRY_API_VERSION,
        modelVersionId: 1,
      },
    },
    mockBFFResponse(mockModelVersion({ id: '1', name: 'Version 2' })),
  );

  cy.interceptApi(
    `GET /api/:apiVersion/model_registry/:modelRegistryName/registered_models/:registeredModelId/versions`,
    {
      path: {
        modelRegistryName: 'modelregistry-sample',
        apiVersion: MODEL_REGISTRY_API_VERSION,
        registeredModelId: 2,
      },
    },
    mockBFFResponse(mockModelVersionList({ items: modelVersions })),
  );

  cy.interceptApi(
    `GET /api/:apiVersion/model_registry/:modelRegistryName/registered_models/:registeredModelId`,
    {
      path: {
        modelRegistryName: 'modelregistry-sample',
        apiVersion: MODEL_REGISTRY_API_VERSION,
        registeredModelId: 2,
      },
    },
    mockBFFResponse(mockRegisteredModel({ id: '2', name: 'model 2', state: ModelState.ARCHIVED })),
  );

  cy.interceptApi(
    `GET /api/:apiVersion/model_registry/:modelRegistryName/registered_models/:registeredModelId`,
    {
      path: {
        modelRegistryName: 'modelregistry-sample',
        apiVersion: MODEL_REGISTRY_API_VERSION,
        registeredModelId: 3,
      },
    },
    mockBFFResponse(mockRegisteredModel({ id: '3', name: 'model 3' })),
  );
};

describe('Model archive list', () => {
  it('No archive models in the selected model registry', () => {
    initIntercepts({
      registeredModels: [],
    });
    registeredModelArchive.visit();
    verifyRelativeURL('/modelRegistry/modelregistry-sample/registeredModels/archive');
    registeredModelArchive.shouldArchiveVersionsEmpty();
  });

  it('Archived model details browser back button should lead to archived models table', () => {
    initIntercepts({});
    registeredModelArchive.visit();
    verifyRelativeURL('/modelRegistry/modelregistry-sample/registeredModels/archive');
    registeredModelArchive.findArchiveModelBreadcrumbItem().contains('Archived models');
    const archiveModelRow = registeredModelArchive.getRow('model 2');
    archiveModelRow.findName().contains('model 2').click();
    verifyRelativeURL('/modelRegistry/modelregistry-sample/registeredModels/archive/2/versions');
    cy.findByTestId('app-page-title').should('have.text', 'model 2Archived');
    cy.go('back');
    verifyRelativeURL('/modelRegistry/modelregistry-sample/registeredModels/archive');
    registeredModelArchive.findArchiveModelTable().should('be.visible');
  });

  it('Archived model with no versions', () => {
    initIntercepts({ modelVersions: [] });
    registeredModelArchive.visit();
    verifyRelativeURL('/modelRegistry/modelregistry-sample/registeredModels/archive');
    registeredModelArchive.findArchiveModelBreadcrumbItem().contains('Archived models');
    const archiveModelRow = registeredModelArchive.getRow('model 2');
    archiveModelRow.findName().contains('model 2').click();
    modelRegistry.shouldArchiveModelVersionsEmpty();
  });

  it('Archived model flow', () => {
    initIntercepts({});
    registeredModelArchive.visitArchiveModelVersionList();
    verifyRelativeURL('/modelRegistry/modelregistry-sample/registeredModels/archive/2/versions');

    modelRegistry.findModelVersionsTable().should('be.visible');
    modelRegistry.findModelVersionsTableRows().should('have.length', 2);
    const version = modelRegistry.getModelVersionRow('model version');
    version.findModelVersionName().contains('model version').click();
    verifyRelativeURL(
      '/modelRegistry/modelregistry-sample/registeredModels/archive/2/versions/1/details',
    );
    cy.go('back');
    verifyRelativeURL('/modelRegistry/modelregistry-sample/registeredModels/archive/2/versions');
  });

  it('Archive models list', () => {
    initIntercepts({});
    registeredModelArchive.visit();
    verifyRelativeURL('/modelRegistry/modelregistry-sample/registeredModels/archive');

    //breadcrumb
    registeredModelArchive.findArchiveModelBreadcrumbItem().contains('Archived models');

    // name, last modified, owner, labels modal
    registeredModelArchive.findArchiveModelTable().should('be.visible');
    registeredModelArchive.findArchiveModelsTableRows().should('have.length', 2);

    const archiveModelRow = registeredModelArchive.getRow('model 1');

    archiveModelRow.findLabelModalText().contains('5 more');
    archiveModelRow.findLabelModalText().click();
    labelModal.shouldContainsModalLabels([
      'Financial',
      'Financial data',
      'Fraud detection',
      'Test label',
      'Machine learning',
      'Next data to be overflow',
      'Test label x',
      'Test label y',
      'Test label y',
    ]);
    labelModal.findCloseModal().click();

    // sort by Last modified
    registeredModelArchive
      .findRegisteredModelsArchiveTableHeaderButton('Last modified')
      .should(be.sortAscending);
    registeredModelArchive.findRegisteredModelsArchiveTableHeaderButton('Last modified').click();
    registeredModelArchive
      .findRegisteredModelsArchiveTableHeaderButton('Last modified')
      .should(be.sortDescending);

    // sort by Model name
    registeredModelArchive.findRegisteredModelsArchiveTableHeaderButton('Model name').click();
    registeredModelArchive
      .findRegisteredModelsArchiveTableHeaderButton('Model name')
      .should(be.sortAscending);
    registeredModelArchive.findRegisteredModelsArchiveTableHeaderButton('Model name').click();
    registeredModelArchive
      .findRegisteredModelsArchiveTableHeaderButton('Model name')
      .should(be.sortDescending);
  });
});

// TODO: Uncomment when dropdowns are fixed
// it('Opens the detail page when we select "View Details" from action menu', () => {
//   initIntercepts({});
//   registeredModelArchive.visit();
//   const archiveModelRow = registeredModelArchive.getRow('model 2');
//   archiveModelRow.findKebabAction('View details').click();
//   cy.location('pathname').should(
//     'be.equals',
//     '/modelRegistry/modelregistry-sample/registeredModels/archive/2/details',
//   );
// });

// TODO: Uncomment when we have mock data for restoring and archiving
// describe('Restoring archive model', () => {
//   it('Restore from archive models table', () => {
//     cy.interceptApi(
//       'PATCH /api/:apiVersion/model_registry/:modelRegistryName/registered_models/:registeredModelId',
//       {
//         path: {
//           modelRegistryName: 'modelregistry-sample',
//           apiVersion: MODEL_REGISTRY_API_VERSION,
//           registeredModelId: 2,
//         },
//       },
//       mockBFFResponse(mockRegisteredModel({ id: '2', name: 'model 2', state: ModelState.LIVE })),
//     ).as('modelRestored');

//     initIntercepts({});
//     registeredModelArchive.visit();

//     const archiveModelRow = registeredModelArchive.getRow('model 2');
//     archiveModelRow.findKebabAction('Restore model').click();

//     restoreModelModal.findRestoreButton().click();

//     cy.wait('@modelRestored').then((interception) => {
//       expect(interception.request.body).to.eql({
//         state: 'LIVE',
//       });
//     });
//   });

//   it('Restore from archive model details', () => {
//     cy.interceptApi(
//       'PATCH /api/service/modelregistry/:serviceName/api/model_registry/:apiVersion/registered_models/:registeredModelId',
//       {
//         path: {
//           serviceName: 'modelregistry-sample',
//           apiVersion: MODEL_REGISTRY_API_VERSION,
//           registeredModelId: 2,
//         },
//       },
//       mockRegisteredModel({ id: '2', name: 'model 2', state: ModelState.LIVE }),
//     ).as('modelRestored');

//     initIntercepts({});
//     registeredModelArchive.visitArchiveModelDetail();

//     registeredModelArchive.findRestoreButton().click();
//     restoreModelModal.findRestoreButton().click();

//     cy.wait('@modelRestored').then((interception) => {
//       expect(interception.request.body).to.eql({
//         state: 'LIVE',
//       });
//     });
//   });
// });

// describe('Archiving model', () => {
//   it('Archive model from registered models table', () => {
//     cy.interceptApi(
//       'PATCH /api/service/modelregistry/:serviceName/api/model_registry/:apiVersion/registered_models/:registeredModelId',
//       {
//         path: {
//           serviceName: 'modelregistry-sample',
//           apiVersion: MODEL_REGISTRY_API_VERSION,
//           registeredModelId: 3,
//         },
//       },
//       mockRegisteredModel({ id: '3', name: 'model 3', state: ModelState.ARCHIVED }),
//     ).as('modelArchived');

//     initIntercepts({});
//     registeredModelArchive.visitModelList();

//     const modelRow = modelRegistry.getRow('model 3');
//     modelRow.findKebabAction('Archive model').click();
//     archiveModelModal.findArchiveButton().should('be.disabled');
//     archiveModelModal.findModalTextInput().fill('model 3');
//     archiveModelModal.findArchiveButton().should('be.enabled').click();
//     cy.wait('@modelArchived').then((interception) => {
//       expect(interception.request.body).to.eql({
//         state: 'ARCHIVED',
//       });
//     });
//   });

//   it('Archive model from model details', () => {
//     cy.interceptApi(
//       'PATCH /api/service/modelregistry/:serviceName/api/model_registry/:apiVersion/registered_models/:registeredModelId',
//       {
//         path: {
//           serviceName: 'modelregistry-sample',
//           apiVersion: MODEL_REGISTRY_API_VERSION,
//           registeredModelId: 3,
//         },
//       },
//       mockRegisteredModel({ id: '3', name: 'model 3', state: ModelState.ARCHIVED }),
//     ).as('modelArchived');

//     initIntercepts({});
//     registeredModelArchive.visitModelList();

//     const modelRow = modelRegistry.getRow('model 3');
//     modelRow.findName().contains('model 3').click();
//     registeredModelArchive
//       .findModelVersionsDetailsHeaderAction()
//       .findDropdownItem('Archive model')
//       .click();

//     archiveModelModal.findArchiveButton().should('be.disabled');
//     archiveModelModal.findModalTextInput().fill('model 3');
//     archiveModelModal.findArchiveButton().should('be.enabled').click();
//     cy.wait('@modelArchived').then((interception) => {
//       expect(interception.request.body).to.eql({
//         state: 'ARCHIVED',
//       });
//     });
//   });
//});