import TestsConfig from './tests.config.js';

import FileCustodianLib from '../lib';
import FileCustodianBuild from '../build';
const FileCustodian = TestsConfig.sourcePath == "../lib" ? FileCustodianLib : FileCustodianBuild;

import FCFileLib from '../lib/assets/file.js';
import FCFileBuild from '../build/assets/file.js';
const FCFile = TestsConfig.sourcePath == "../lib" ? FCFileLib : FCFileBuild;

const timeout = TestsConfig.testTimeout;

describe('mega', () => {
    const custodian = new FileCustodian(TestsConfig.custodian);

    test('mega.depository.creation', async () => {
        await custodian.newDepository(TestsConfig.megaDepository);

        const response = await custodian.depository(TestsConfig.megaDepository.name).init();
        expect(response).toBe(true);
    }, timeout);

    let databaseConnectionResponse = false;
    describe('mega.depository.database', () => {
        test('mega.depository.database.creation', async () => {
            const response = await custodian.depository(TestsConfig.megaDepository.name).newDatabase(TestsConfig.dbForDepositoryTesting.toString().trim() == "sql" ? TestsConfig.sqlDb : TestsConfig.nosqlDb);
            expect(response).toBe(true);
        }, timeout);

        test('mega.depository.database.connection', async () => {
            databaseConnectionResponse = await custodian.depository(TestsConfig.megaDepository.name).database().connect();
            expect(databaseConnectionResponse).toBe(true);
        }, timeout);

        test('mega.depository.database.table.creation', async () => {
            const response = await custodian.depository(TestsConfig.megaDepository.name).database().createTable();
            expect(response).toBe(true);
        }, timeout);
    });

    describe('mega.depository.protector', () => {
        test('mega.depository.protector.creation', async () => {
            const response = await custodian.depository(TestsConfig.megaDepository.name).newProtector(TestsConfig.protector);
            expect(response).toBe(true);
        }, timeout);
    });

    describe('mega.depository.file', () => {
        let file = null;
        let copiedFile = null;

        test('mega.depository.file.new', async () => {
            file = await custodian.depository(TestsConfig.megaDepository.name).newFile({ name: "testfile", ext: "txt", contents: "abcdefghijklmnopqrstuvwxyz", folder: "tests" });
            expect(file).toBeInstanceOf(FCFile);
        }, timeout);

        describe('mega.depository.file.get', () => {
            test('mega.depository.file.getByMeta', async () => {
                file = await custodian.depository(TestsConfig.megaDepository.name).getFile({ name: "testfile", ext: "txt", folder: "tests" });
                expect(file).toBeInstanceOf(FCFile);
            }, timeout);

            test('mega.depository.file.getByPath', async () => {
                file = await custodian.depository(TestsConfig.megaDepository.name).getFile({ path: "tests/testfile.txt" });
                expect(file).toBeInstanceOf(FCFile);
            }, timeout);

            test('mega.depository.file.getById', async () => {
                if(file){ file = await custodian.depository(TestsConfig.megaDepository.name).getFile({ id: file.config.id }); }
                expect(file).toBeInstanceOf(FCFile);
            }, timeout);
        }, timeout);

        test('mega.depository.file.record', async () => {
            const response = await file.record();
            expect(response).toBe(true);
        }, timeout);

        test('mega.depository.file.read', async () => {
            const { contents, contentType, contentLength, readStream } = await file.getContents();
            expect(contents).not.toBe(null);
            expect(readStream).not.toBe(null);
        }, timeout);

        test('mega.depository.file.rename', async () => {
            const response = await file.rename("testfile_rename");
            expect(response).toBe(true);
        }, timeout);

        test('mega.depository.file.unprotect', async () => {
            const response = await file.unprotect();
            expect(response).toBe(true);
        }, timeout);

        test('mega.depository.file.protect', async () => {
            const response = await file.protect();
            expect(response).toBe(true);
        }, timeout);

        test('mega.depository.file.search', async () => {
            const response = await custodian.depository(TestsConfig.megaDepository.name).searchFiles({ folder: "tests", query: "NAME:testfile_rename", forceRequestToProvider: true })
            expect(response).toBeInstanceOf(Array);
            expect(response.length).toBe(1);
        }, timeout);

        test('mega.depository.file.sync', async () => {
            const response = await custodian.depository(TestsConfig.megaDepository.name).syncDatabase();
            expect(response).toBeInstanceOf(Array);
        }, timeout);

        test('mega.depository.file.copy', async () => {
            copiedFile = await file.copyToFolder("tests/copies");
            expect(copiedFile).toBeInstanceOf(FCFile);
        }, timeout);

        test('mega.depository.file.delete', async () => {
            const response1 = await file.delete();
            const response2 = await copiedFile.delete();
            expect(response1).toBe(true);
            expect(response2).toBe(true);
        }, timeout);
    });

    describe("mega.depository.database", () => {
        test('mega.depository.database.disconnection', async () => {
            let response = false;
            if(databaseConnectionResponse === true){
                // Only for testing
                try{
                    if(TestsConfig.dbForDepositoryTesting.toString().trim() == "sql"){
                        await custodian.depository(TestsConfig.megaDepository.name).database().sequelize.close();
                        response = true;
                    }else{
                        await custodian.depository(TestsConfig.megaDepository.name).database().mongoose.connection.close();
                        response = true;
                    }
                }catch(error){ console.log("[TEST-LOG] ", error); }
            }else{ response = true; }

            expect(response).toBe(true);
        }, timeout);
    });
});
