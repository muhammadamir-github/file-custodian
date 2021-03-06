import TestsConfig from './tests.config.js';

import FileCustodianLib from '../lib';
import FileCustodianBuild from '../build';
const FileCustodian = TestsConfig.sourcePath == "../lib" ? FileCustodianLib : FileCustodianBuild;

import FCFileLib from '../lib/assets/file.js';
import FCFileBuild from '../build/assets/file.js';
const FCFile = TestsConfig.sourcePath == "../lib" ? FCFileLib : FCFileBuild;

const timeout = TestsConfig.testTimeout;

describe('backblazeb2', () => {
    const custodian = new FileCustodian(TestsConfig.custodian);

    test('backblazeb2.depository.creation', async () => {
        await custodian.newDepository(TestsConfig.b2Depository);

        const response = await custodian.depository(TestsConfig.b2Depository.name).init();
        expect(response).toBe(true);
    }, timeout);

    let databaseConnectionResponse = false;
    describe('backblazeb2.depository.database', () => {
        test('backblazeb2.depository.database.creation', async () => {
            const response = await custodian.depository(TestsConfig.b2Depository.name).newDatabase(TestsConfig.dbForDepositoryTesting.toString().trim() == "sql" ? TestsConfig.sqlDb : TestsConfig.nosqlDb);
            expect(response).toBe(true);
        }, timeout);

        test('backblazeb2.depository.database.connection', async () => {
            databaseConnectionResponse = await custodian.depository(TestsConfig.b2Depository.name).database().connect();
            expect(databaseConnectionResponse).toBe(true);
        }, timeout);

        test('backblazeb2.depository.database.table.creation', async () => {
            const response = await custodian.depository(TestsConfig.b2Depository.name).database().createTable();
            expect(response).toBe(true);
        }, timeout);
    });

    describe('backblazeb2.depository.protector', () => {
        test('backblazeb2.depository.protector.creation', async () => {
            const response = await custodian.depository(TestsConfig.b2Depository.name).newProtector(TestsConfig.protector);
            expect(response).toBe(true);
        }, timeout);
    });

    describe('backblazeb2.depository.file', () => {
        let file = null;
        let copiedFile = null;

        test('backblazeb2.depository.file.new', async () => {
            file = await custodian.depository(TestsConfig.b2Depository.name).newFile({ name: "testfile", ext: "txt", contents: "abcdefghijklmnopqrstuvwxyz", folder: "tests" });
            expect(file).toBeInstanceOf(FCFile);
        }, timeout);

        describe('backblazeb2.depository.file.get', () => {
            test('backblazeb2.depository.file.getByMeta', async () => {
                file = await custodian.depository(TestsConfig.b2Depository.name).getFile({ name: "testfile", ext: "txt", folder: "tests" });
                expect(file).toBeInstanceOf(FCFile);
            }, timeout);

            test('backblazeb2.depository.file.getByPath', async () => {
                file = await custodian.depository(TestsConfig.b2Depository.name).getFile({ path: "tests/testfile.txt" });
                expect(file).toBeInstanceOf(FCFile);
            }, timeout);

            test('backblazeb2.depository.file.getById', async () => {
                if(file){ file = await custodian.depository(TestsConfig.b2Depository.name).getFile({ id: file.config.id }); }
                expect(file).toBeInstanceOf(FCFile);
            }, timeout);
        }, timeout);

        test('backblazeb2.depository.file.record', async () => {
            const response = await file.record();
            expect(response).toBe(true);
        }, timeout);

        test('backblazeb2.depository.file.read', async () => {
            const { contents, contentType, contentLength, readStream } = await file.getContents();
            expect(contents).not.toBe(null);
            expect(readStream).not.toBe(null);
        }, timeout);

        test('backblazeb2.depository.file.rename', async () => {
            const response = await file.rename("testfile_rename");
            expect(response).toBe(true);
        }, timeout);

        test('backblazeb2.depository.file.unprotect', async () => {
            const response = await file.unprotect();
            expect(response).toBe(true);
        }, timeout);

        test('backblazeb2.depository.file.protect', async () => {
            const response = await file.protect();
            expect(response).toBe(true);
        }, timeout);

        test('backblazeb2.depository.file.search', async () => {
            const response = await custodian.depository(TestsConfig.b2Depository.name).searchFiles({ folder: "tests", query: "NAME:testfile_rename", forceRequestToProvider: true })
            expect(response).toBeInstanceOf(Array);
            expect(response.length).toBe(1);
        }, timeout);

        test('backblazeb2.depository.file.sync', async () => {
            const response = await custodian.depository(TestsConfig.b2Depository.name).syncDatabase();
            expect(response).toBeInstanceOf(Array);
        }, timeout);

        test('backblazeb2.depository.file.copy', async () => {
            copiedFile = await file.copyToFolder("tests/copies");
            expect(copiedFile).toBeInstanceOf(FCFile);
        }, timeout);

        test('backblazeb2.depository.file.delete', async () => {
            const response1 = await file.delete();
            const response2 = await copiedFile.delete();
            expect(response1).toBe(true);
            expect(response2).toBe(true);
        }, timeout);
    });

    describe("backblazeb2.depository.database", () => {
        test('backblazeb2.depository.database.disconnection', async () => {
            let response = false;
            if(databaseConnectionResponse === true){
                // Only for testing
                try{
                    if(TestsConfig.dbForDepositoryTesting.toString().trim() == "sql"){
                        await custodian.depository(TestsConfig.b2Depository.name).database().sequelize.close();
                        response = true;
                    }else{
                        await custodian.depository(TestsConfig.b2Depository.name).database().mongoose.connection.close();
                        response = true;
                    }
                }catch(error){ console.log("[TEST-LOG] ", error); }
            }else{ response = true; }

            expect(response).toBe(true);
        }, timeout);
    });
});
